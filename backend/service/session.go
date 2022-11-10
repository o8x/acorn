package service

import (
	"fmt"
	"strings"

	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/scripts"
	"github.com/o8x/acorn/backend/utils/stringbuilder"
)

type Sess struct {
	model.Connect
	Workdir    string        `json:"-"`
	Tags       []interface{} `json:"tags"`
	TagsString string        `json:"tags_string"`
}

type SessionService struct {
	*Service
}

func (s *SessionService) GetTags() {

}

func (s *SessionService) GetConnects() {

}

func (s *SessionService) DeleteConnect() {

}

func (s *SessionService) EditConnect() {

}

func (s *SessionService) PingConnect() {

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

func (s *SessionService) OpenRDPSession(id int64) *response.Response {
	return nil
}

func (s *SessionService) makeSSHArgs(sess model.Connect) (*stringbuilder.Builder, error) {
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
		return s.OpenRDPSession(id)
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

func (s *SessionService) AddConnect() {

}

// CIDR 计算器
