package shell

import (
	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
)

type Plugin struct {
	base.Plugin[constant.ShellParams]
}

func (s *Plugin) Run() (string, error) {
	res, err := s.SSH.ExecShellCode(s.Params.Command)
	if err != nil {
		return "", err
	}

	s.Logger.Write("command: %s", s.Params.Command)
	s.Logger.Write("output: %s", res)

	return res.String(), err
}
