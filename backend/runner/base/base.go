package base

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/o8x/acorn/backend/runner/constant"
	"github.com/o8x/acorn/backend/runner/logger"
	"github.com/o8x/acorn/backend/ssh"
)

type Plugin[T constant.PluginTypes] struct {
	SSH     *ssh.SSH        `json:"ssh"`
	Params  *T              `json:"params"`
	Context context.Context `json:"context"`
	Logger  *logger.Logger
}

func (s *Plugin[T]) RemoteFileExist(file string) bool {
	_, err := s.SSH.ExecShellCode(fmt.Sprintf(`exit $(test -e '%s')`, file))
	return err == nil
}

func (s *Plugin[T]) ParseParams(params []byte) error {
	var args T
	if err := json.Unmarshal(params, &args); err != nil {
		return err
	}

	s.Params = &args
	return nil
}

func (s *Plugin[T]) InjectLogger(fn *logger.Logger) {
	s.Logger = fn
}

func (s *Plugin[T]) InjectSSH(ssh *ssh.SSH) {
	s.SSH = ssh
}

func (s *Plugin[T]) InjectContext(ctx context.Context) {
	s.Context = ctx
}
