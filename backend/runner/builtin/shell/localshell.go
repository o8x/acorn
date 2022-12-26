package shell

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
	"github.com/o8x/acorn/backend/runner/utils"
)

type LocalShell struct {
	base.Plugin[constant.ShellParams]
}

func (s *LocalShell) Run() (string, error) {
	envs := os.Environ()
	envs = append(envs, fmt.Sprintf(`PATH=%s:/opt/homebrew/sbin:/opt/homebrew/bin:/usr/local/bin`, os.Getenv("PATH")))
	if s.Params.Environments != nil {
		for k, v := range s.Params.Environments {
			envs = append(envs, fmt.Sprintf("%s=%s", k, v))
			s.Logger.Write("with environment: %s=%s", k, v)
		}
	}

	buf := bytes.Buffer{}
	for _, c := range s.Params.Commands {
		cmd := exec.Command(os.Getenv("SHELL"), "-exc", c)
		cmd.Env = envs

		if s.Params.WorkDir != "" {
			cmd.Dir = utils.FillEnv(s.Params.WorkDir)
		}

		s.Logger.Write("workdir: %s", cmd.Dir)
		s.Logger.Write("command: %s", cmd.String())

		output, err := cmd.CombinedOutput()
		if output != nil {
			buf.Write(output)
			s.Logger.Write("output: %s", output)
		}

		if err != nil {
			return string(output), err
		}
	}

	return buf.String(), nil
}
