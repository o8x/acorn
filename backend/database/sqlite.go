package database

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"
	"github.com/o8x/acorn/backend/logger"
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

	tabel := map[string]any{
		"connect_sum_count":            0,
		"connect_rdp_sum_count":        0,
		"ping_sum_count":               0,
		"top_sum_count":                0,
		"scp_upload_sum_count":         0,
		"scp_download_sum_count":       0,
		"scp_cloud_download_sum_count": 0,
		"local_iterm_sum_count":        0,
		"import_rdp_sum_count":         0,
		"file_transfer_sum_count":      0,
		"copy_id_sum_count":            0,
		"edit_file_sum_count":          0,
		"delete_file_sum_count":        0,
		"scp_upload_base64_sum_count":  0,
		"automation_sum_count":         0,
		"theme":                        "light",
	}

	for k, v := range tabel {
		err := query.CreateConfigKey(context.Background(), queries.CreateConfigKeyParams{
			Key:   k,
			Value: fmt.Sprintf("%v", v),
		})

		if err != nil {
			logger.Error(err)
		}
	}

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
