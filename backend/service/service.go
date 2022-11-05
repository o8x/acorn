package service

import (
	"context"

	"github.com/o8x/acorn/backend/model"
)

type Service struct {
	DB      *model.Queries
	Context context.Context
}
