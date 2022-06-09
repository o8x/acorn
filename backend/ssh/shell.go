package ssh

import (
	"bytes"
	_ "embed"
)

//go:embed listdir.py
var listdir []byte

func ListRemoteDir(conn *Connection, dir string) (string, error) {
	code := bytes.ReplaceAll(listdir, []byte("{dir}"), []byte(dir))
	buf, err := conn.ExecPythonCode(code)
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}
