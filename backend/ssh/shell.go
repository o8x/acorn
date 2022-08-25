package ssh

import (
	"bytes"
	_ "embed"
	"encoding/json"
)

//go:embed listdir.py
var listdir []byte

//go:embed probeosinfo.py
var proberOSInfo []byte

type OsRelease struct {
	PrettyName   string `json:"pretty_name"`
	Name         string `json:"name"`
	VersionId    string `json:"version_id"`
	Version      string `json:"version"`
	ID           string `json:"id"`
	HomeUrl      string `json:"home_url"`
	SupportUrl   string `json:"support_url"`
	BugReportUrl string `json:"bug_report_url"`
}

func ListRemoteDir(conn *Connection, dir string) (string, error) {
	code := bytes.ReplaceAll(listdir, []byte("{dir}"), []byte(dir))
	buf, err := conn.ExecPythonCode(code)
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}

func ProberOSInfo(conn *Connection) (*OsRelease, error) {
	buf, err := conn.ExecPythonCode(proberOSInfo)
	if err != nil {
		return nil, err
	}

	var osRelease OsRelease
	if err = json.Unmarshal(buf.Bytes(), &osRelease); err != nil {
		return nil, err
	}

	return &osRelease, nil
}

func WriteFile(conn *Connection, name, content string) error {
	_, err := conn.WriteFile(name, []byte(content))
	return err
}
