package filesystem

import (
	"fmt"
	"strings"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
)

type RemoteDeletePlugin struct {
	base.Plugin[constant.RemoteDeleteParams]
}

func (s *RemoteDeletePlugin) Run() (string, error) {
	cmd := []string{
		"rm",
	}

	if s.Params.Recursion {
		cmd = append(cmd, "-r")
	}

	if s.Params.Force {
		cmd = append(cmd, "-f")
	}

	// 判断文件是否存在
	if s.Params.CheckExist && !s.RemoteFileExist(s.Params.Path) {
		return "", fmt.Errorf("%s is not exists in remote", s.Params.Path)
	}

	filename := strings.TrimSpace(s.Params.Path)
	command := strings.Join(append(cmd, fmt.Sprintf(`'%s'`, filename)), " ")

	s.Logger.Write("filename: %s", filename)
	s.Logger.Write("command: %s", command)

	res, err := s.SSH.ExecShellCode(command)
	if err != nil {
		return "", err
	}

	s.Logger.Write("output: %s", res)
	return res.String(), err
}
