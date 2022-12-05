package model

import (
	"github.com/o8x/acorn/backend/database/queries"
)

func GetTags() []queries.Tag {
	tags, err := db.GetTags(ctx)
	if err != nil {
		return nil
	}

	return tags
}
