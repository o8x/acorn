package runner

import (
	"context"

	"github.com/o8x/acorn/backend/runner/logger"
	"github.com/o8x/acorn/backend/ssh"
)

type Plugin interface {
	InjectContext(ctx context.Context)
	InjectLogger(*logger.Logger)
	InjectSSH(*ssh.SSH)
	ParseParams([]byte) error
	Run() (string, error)
}
