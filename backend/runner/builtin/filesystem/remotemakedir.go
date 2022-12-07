package filesystem

import (
	"strings"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
)

type RemoteMakeDir struct {
	base.Plugin[constant.MakeDirParams]
}

func (s *RemoteMakeDir) Run() (string, error) {
	cmd := []string{
		"mkdir",
	}

	if s.Params.Recursion {
		cmd = append(cmd, "-p")
	}

	command := strings.Join(append(cmd, s.Params.Path), " ")

	s.Logger.Write("path: %s", s.Params.Path)
	s.Logger.Write("recursion: %s", s.Params.Recursion)
	s.Logger.Write("command: %s", command)

	res, err := s.SSH.ExecShellCode(command)
	if err != nil {
		return "", err
	}

	s.Logger.Write("output: %s", res)
	return res.String(), err
}
