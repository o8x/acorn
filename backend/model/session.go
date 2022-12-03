package model

import "github.com/o8x/acorn/backend/database/queries"

func FindSessionDefaultNil(id int64) *queries.Connect {
	if id == 0 {
		return nil
	}

	session, _ := db.FindSession(ctx, id)
	return &session
}
