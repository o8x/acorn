package service

import (
	"context"
	"database/sql"
)

type Service struct {
	DB      *sql.DB
	Context context.Context
}
