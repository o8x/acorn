package database

import (
	"database/sql"
	_ "embed"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"

	"github.com/o8x/acorn/backend/database/queries"
)

var (
	//go:embed ddl.sql
	ddl   string
	ins   *sql.DB
	query *queries.Queries
)

func Get() *sql.DB {
	return ins
}

func GetQueries() *queries.Queries {
	return query
}

func Init(filename string) error {
	db, err := sql.Open("sqlite3", filename)
	if err != nil {
		return err
	}

	query = queries.New(db)
	ins = db

	_, err = db.Exec(ddl)
	return err
}

func AutoCreateDB(file string) error {
	if err := os.MkdirAll(filepath.Dir(file), 0755); err != nil {
		return err
	}

	if err := os.WriteFile(file, []byte(""), 0755); err != nil {
		return err
	}

	return Init(file)
}
