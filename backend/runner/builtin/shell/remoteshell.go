package shell

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
)

type RemoteShell struct {
	base.Plugin[constant.ShellParams]
}

func (s *RemoteShell) Run() (string, error) {
	buf := bytes.Buffer{}
	for _, c := range s.Params.Commands {
		b := strings.Builder{}
		if s.Params.WorkDir != "" {
			s.Logger.Write("workdir: %s", s.Params.WorkDir)
			b.WriteString(fmt.Sprintf("cd %s\n", s.Params.WorkDir))
		}

		if s.Params.Environments != nil {
			for k, v := range s.Params.Environments {
				b.WriteString(fmt.Sprintf("export %s='%s'\n", k, v))
				s.Logger.Write("with environment: %s=%s", k, v)
			}
		}

		b.WriteString(c)
		b64CMD := base64.StdEncoding.EncodeToString([]byte(b.String()))

		code := fmt.Sprintf(`echo '%s' | base64 -d | $SHELL -ex`, b64CMD)
		s.Logger.Write("command: %s, remote code: %s", c, code)
		res, err := s.SSH.ExecShellCode(code)

		s.Logger.Write("output: %s", res.String())
		buf.Write(res.Bytes())

		if err != nil {
			return "", err
		}
	}

	return buf.String(), nil
}
