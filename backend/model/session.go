package model

import (
	"encoding/json"

	"github.com/o8x/acorn/backend/database/queries"
)

type Sess struct {
	queries.Connect
	Tags []int64 `json:"tags"`
}

func (s Sess) InTag(tag int64) bool {
	for _, i := range s.Tags {
		if i == tag {
			return true
		}
	}
	return false
}

func FindSessionDefaultNil(id int64) *queries.Connect {
	if id == 0 {
		return nil
	}

	session, _ := db.FindSession(ctx, id)
	return &session
}

func GetSessions() []*Sess {
	list, err := db.GetSessions(ctx)
	if err != nil {
		return nil
	}

	var res []*Sess
	for _, connect := range list {
		r := &Sess{Connect: connect}
		res = append(res, r)
		_ = json.Unmarshal([]byte(connect.Tags), &r.Tags)
	}

	return res
}
