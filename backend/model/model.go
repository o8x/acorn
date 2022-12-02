package model

import (
	"context"

	"github.com/o8x/acorn/backend/database/queries"
)

var (
	ctx context.Context
	db  *queries.Queries
)

func SetContext(ctx2 context.Context) {
	ctx = ctx2
}

func SetQueries(db2 *queries.Queries) {
	db = db2
}
