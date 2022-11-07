package service

import (
	"path/filepath"

	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/ssh"
)

type FileSystemService struct {
	*Service
}

func (t *FileSystemService) CleanPath(path string) string {
	return filepath.Clean(path)
}

func (t *FileSystemService) ListDir(id int64, dir string) *response.Response {
	session, err := t.DB.FindSession(t.Context, id)
	if err != nil {
		return response.Error(err)
	}

	if err = t.DB.StatsIncFileTransfer(t.Context); err != nil {
		return response.Error(err)
	}

	var proxy *model.Connect
	if session.ProxyServerID != 0 {
		p, err := t.DB.FindSession(t.Context, session.ProxyServerID)
		if err != nil {
			return response.Error(err)
		}
		proxy = &p
	}

	conn := ssh.Start(ssh.SSH{
		Config:      session,
		ProxyConfig: proxy,
	})

	if err := conn.Connect(); err != nil {
		return response.Error(err)
	}

	list, err := ssh.ListRemoteDir(conn, dir)
	if err != nil {
		return response.Error(err)
	}

	if err = t.DB.UpdateSessionUseTime(t.Context, id); err != nil {
		return response.Error(err)
	}

	return response.OK(list)
}

func (t *FileSystemService) DownloadFiles() {

}

func (t *FileSystemService) RemoveFiles() {

}

func (t *FileSystemService) EditFile() {

}

func (t *FileSystemService) SaveFile() {

}

func (t *FileSystemService) UploadFiles() {

}

func (t *FileSystemService) CloudDownload() {

}

func (t *FileSystemService) DragUploadFiles() {

}

func (t *FileSystemService) OpenSshSession() {

}
