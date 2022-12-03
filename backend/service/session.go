package service

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/o8x/acorn/backend/database/queries"
	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/scripts"
	"github.com/o8x/acorn/backend/ssh"
	"github.com/o8x/acorn/backend/utils/stringbuilder"
)

type Sess struct {
	queries.Connect
	Workdir    string        `json:"-"`
	Tags       []interface{} `json:"tags"`
	TagsString string        `json:"tags_string"`
}

type SessionService struct {
	*Service
}

func (s *SessionService) GetTags() {

}

func (s *SessionService) GetSessions() *response.Response {
	sessions, err := s.DB.GetSessions(s.Context)
	if err != nil {
		return response.Error(err)
	}

	return response.OK(sessions)
}

func (s *SessionService) QuerySessions(keyword string) *response.Response {
	if keyword == "" {
		return s.GetSessions()
	}

	sessions, err := s.DB.QuerySessions(s.Context, queries.QuerySessionsParams{
		Host:     fmt.Sprintf("%%%s%%", keyword),
		Username: fmt.Sprintf("%%%s%%", keyword),
		Label:    fmt.Sprintf("%%%s%%", keyword),
	})
	if err != nil {
		return response.Error(err)
	}

	return response.OK(sessions)
}

func (s *SessionService) DeleteConnect(id int64) *response.Response {
	if _, err := s.DB.FindSession(s.Context, id); err != nil {
		return response.Error(err)
	}

	if err := s.DB.DeleteSession(s.Context, id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

type EditSessionParams struct {
	queries.UpdateSessionParams
	Tags []any `json:"tags"`
}

func (s *SessionService) UpdateSession(it EditSessionParams) *response.Response {
	t2 := &TagService{Service: s.Service}

	var tags []interface{}
	for _, t := range it.Tags {
		if i, ok := t.(float64); ok {
			tags = append(tags, i)
		}

		if i, ok := t.(string); ok {
			id, err := t2.AddOne(i)
			if err != nil {
				continue
			}

			tags = append(tags, id)
		}
	}

	bs, _ := json.Marshal(tags)
	tagsString := string(bs)
	if tagsString == "null" {
		tagsString = "[]"
	}

	if it.Type == "linux" {
		conn := ssh.Start(ssh.SSH{
			Config: queries.Connect{
				Host:          it.Host,
				Username:      it.Username,
				Port:          it.Port,
				Password:      it.Password,
				AuthType:      it.AuthType,
				ProxyServerID: it.ProxyServerID,
			},
			ProxyConfig: model.FindSessionDefaultNil(it.ProxyServerID),
		})

		info, err := ssh.ProberOSInfo(conn)
		if err != nil {
			return response.Error(err)
		}

		it.Type = info.ID
		if it.Label == "" {
			it.Label = info.PrettyName
		}
	}

	err := s.DB.UpdateSession(s.Context, queries.UpdateSessionParams{
		Type:          it.Type,
		Label:         it.Label,
		Username:      it.Username,
		Password:      it.Password,
		Port:          it.Port,
		Host:          it.Host,
		PrivateKey:    it.PrivateKey,
		Tags:          tagsString,
		ProxyServerID: it.ProxyServerID,
		Params:        it.Params,
		AuthType:      it.AuthType,
		ID:            it.ID,
	})
	if err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) UpdateSessionLabel(it queries.UpdateSessionLabelParams) *response.Response {
	if err := s.DB.UpdateSessionLabel(s.Context, it); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) PingConnect(id int64) *response.Response {
	sess, err := s.DB.FindSession(s.Context, id)
	if err := s.DB.StatsIncPing(s.Context); err != nil {
		return response.Error(err)
	}

	if err = s.DB.UpdateSessionUseTime(s.Context, id); err != nil {
		return response.Error(err)
	}

	script := scripts.Script{}
	params := scripts.PrepareParams{
		Password: sess.Password,
		Commands: fmt.Sprintf("ping -c 10 %s", sess.Host),
	}

	if err = script.Run(params); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) TopConnect(id int64) *response.Response {
	sess, err := s.DB.FindSession(s.Context, id)
	if sess.Type == "windows" {
		return response.Warn("unsupported windows")
	}

	if err := s.DB.StatsIncTop(s.Context); err != nil {
		return response.Error(err)
	}

	if err = s.DB.UpdateSessionUseTime(s.Context, id); err != nil {
		return response.Error(err)
	}

	sb, err := s.makeSSHArgs(sess)
	sb.WriteString(`'htop -d 10 || top -d 1'`)

	script := scripts.Script{}
	params := scripts.PrepareParams{
		Password: sess.Password,
		Commands: fmt.Sprintf("ssh -t %s", sb.Join(" ")),
	}

	if err = script.Run(params); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) makeRDPFileForSession(sess queries.Connect) (string, error) {
	f, err := os.CreateTemp("", "*.rdp")
	if err != nil {
		return "", err
	}

	defer f.Close()

	sb := stringbuilder.Builder{}
	sb.WriteStringf("full address:s:%s:%d\n", sess.Host, sess.Port)
	sb.WriteStringf("username:s:%s\n", sess.Username)
	sb.WriteStringLn("screen mode id:i:2")
	sb.WriteStringLn("session bpp:i:24")
	sb.WriteStringLn("use multimon:i:0")
	sb.WriteStringLn("redirectclipboard:i:1")
	if _, err := f.Write(sb.Bytes()); err != nil {
		return "", err
	}

	return f.Name(), nil
}

func (s *SessionService) OpenRDPSession(sess queries.Connect) *response.Response {
	if err := s.DB.StatsIncConnectRDP(s.Context); err != nil {
		return response.Error(err)
	}

	if err := s.DB.UpdateSessionUseTime(s.Context, sess.ID); err != nil {
		return response.Error(err)
	}

	filename, err := s.makeRDPFileForSession(sess)
	if err != nil {
		return response.Error(err)
	}

	script := scripts.Script{}
	params := scripts.PrepareParams{
		RDPFilename: filename,
		Password:    sess.Password,
	}

	if err := script.PrepareRDP(params); err != nil {
		return response.Error(err)
	}

	if err := script.Exec(); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) makeSSHArgs(sess queries.Connect) (*stringbuilder.Builder, error) {
	sb := &stringbuilder.Builder{}
	sb.WriteNEString(strings.TrimSpace(sess.Params))

	if !strings.Contains(sess.Params, "ProxyCommand") && sess.ProxyServerID != 0 {
		p, err := s.DB.FindSession(s.Context, sess.ProxyServerID)
		if err != nil {
			return nil, err
		}
		sb.WriteString(fmt.Sprintf("-o ProxyCommand='ssh -p %d %s@%s -W %%h:%%p'", p.Port, p.Username, p.Host))
	}

	sb.WriteStringf("-p %d", sess.Port)
	sb.WriteStringf("%s@%s", sess.Username, sess.Host)
	return sb, nil
}

func (s *SessionService) OpenSSHSession(id int64, workdir string) *response.Response {
	sess, err := s.DB.FindSession(s.Context, id)
	if sess.Type == "windows" {
		return s.OpenRDPSession(sess)
	}

	if err := s.DB.StatsIncConnectSSH(s.Context); err != nil {
		return response.Error(err)
	}

	if err = s.DB.UpdateSessionUseTime(s.Context, id); err != nil {
		return response.Error(err)
	}

	sb, err := s.makeSSHArgs(sess)
	sb.WriteStringFunc(func(builder *stringbuilder.Builder) {
		if workdir != "" {
			builder.WriteString(fmt.Sprintf(`'cd %s; $SHELL'`, workdir))
		}
	})

	script := scripts.Script{}
	params := scripts.PrepareParams{
		Password: sess.Password,
		Commands: fmt.Sprintf("ssh -t %s", sb.Join(" ")),
	}

	if err = script.Run(params); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) OpenLocalConsole() *response.Response {
	script := scripts.Script{}
	params := scripts.PrepareParams{}

	if err := script.Run(params); err != nil {
		return response.Error(err)
	}

	if err := s.DB.StatsIncLocalITerm(s.Context); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (s *SessionService) ImportRdpFile() {

}

func (s *SessionService) CreateSession(connect queries.CreateSessionParams) *response.Response {
	if err := s.DB.CreateSession(s.Context, connect); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}
