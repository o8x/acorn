package filesystem

import (
	"fmt"
	"strings"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
)

type RemoteCopy struct {
	base.Plugin[constant.RemoteCopyParams]
}

func (s *RemoteCopy) Run() (string, error) {
	cmd := []string{
		"cp",
	}

	if s.Params.IsDir {
		cmd = append(cmd, "-r")
	}

	source := strings.TrimSpace(s.Params.Source)
	target := strings.TrimSpace(s.Params.Target)
	command := strings.Join(append(cmd, fmt.Sprintf(`'%s' '%s'`, source, target)), " ")

	s.Logger.Write("source: %s", source)
	s.Logger.Write("target: %s", target)
	s.Logger.Write("command: %s", command)

	res, err := s.SSH.ExecShellCode(command)
	if err != nil {
		return "", err
	}

	s.Logger.Write("output: %s", res)
	return res.String(), err
}
