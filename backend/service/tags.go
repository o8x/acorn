package service

import (
	"context"
	"time"

	"github.com/o8x/acorn/backend/database"
)

type Tag struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	CreateTime time.Time `json:"create_time"`
}

type TagService struct {
	*Service
	ctx context.Context
}

func (t *TagService) GetAll() (*[]Tag, error) {
	rows, err := database.Get().Query("select * from tags")
	if err != nil {
		return nil, err
	}

	var tags []Tag
	for rows.Next() {
		it := Tag{}
		err := rows.Scan(&it.ID, &it.Name, &it.CreateTime)
		if err != nil {
			continue
		}
		tags = append(tags, it)
	}

	return &tags, nil
}

func (t *TagService) Add(tags []string) {
	db := database.Get()

	for _, tag := range tags {
		stmt, err := db.Prepare(`insert into tags (name) values (?)`)
		if err != nil {
			continue
		}

		if _, err := stmt.Exec(tag); err != nil {
			continue
		}
	}
}

func (t *TagService) AddOne(tag string) (int, error) {
	db := database.Get()

	stmt, err := db.Prepare(`insert into tags (name) values (?)`)
	if err != nil {
		return 0, err
	}

	res, err := stmt.Exec(tag)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), err
}
