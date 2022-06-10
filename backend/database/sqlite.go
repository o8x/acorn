package database

import (
	"database/sql"
	_ "embed"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var (
	//go:embed ddl.sql
	ddl string
	ins *sql.DB
)

func Get() *sql.DB {
	return ins
}

// Init // 插入数据
// stmt, err := db.Prepare("INSERT INTO userinfo(username, departname, created) values(?,?,?)")
// res, err := stmt.Exec("astaxie", "研发部门", "2012-12-09")
// id, err := res.LastInsertId()
//
// fmt.Println(id)
// // 更新数据
// stmt, err = db.Prepare("update userinfo set username=? where uid=?")
// res, err = stmt.Exec("astaxieupdate", id)
// affect, err := res.RowsAffected()
// fmt.Println(affect)
//
// // 查询数据
// rows, err := db.Query("SELECT * FROM userinfo")
// for rows.Next() {
// 	var uid int
// 	var username string
// 	var department string
// 	var created string
// 	err = rows.Scan(&uid, &username, &department, &created)
// 	fmt.Println(uid)
// 	fmt.Println(username)
// 	fmt.Println(department)
// 	fmt.Println(created)
// }
//
// // 删除数据
// stmt, err = db.Prepare("delete from userinfo where uid=?")
// res, err = stmt.Exec(id)
// affect, err = res.RowsAffected()
// fmt.Println(affect)
// db.Close()
func Init(filename string) error {
	db, err := sql.Open("sqlite3", filename)
	if err != nil {
		return err
	}

	ins = db
	return nil
}

func AutoCreateDB(file string) error {
	if err := os.MkdirAll(filepath.Dir(file), 0755); err != nil {
		return err
	}

	if err := os.WriteFile(file, []byte(""), 0755); err != nil {
		return err
	}

	if err := Init(file); err != nil {
		return err
	}

	_, err := Get().Exec(ddl)
	return err
}
