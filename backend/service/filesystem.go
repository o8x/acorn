package service

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/o8x/acorn/backend/database/queries"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/service/tasker"
	"github.com/o8x/acorn/backend/ssh"
	"github.com/o8x/acorn/backend/utils"
	"github.com/o8x/acorn/backend/utils/messagebox"
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

	var proxy *queries.Connect
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

func (t *FileSystemService) DownloadFiles(id int64, src string) *response.Response {
	session, err := t.DB.FindSession(t.Context, id)
	if err != nil {
		return response.Error(err)
	}

	if err = t.DB.StatsIncScpDown(t.Context); err != nil {
		return response.Error(err)
	}

	if err = t.DB.UpdateSessionUseTime(t.Context, id); err != nil {
		return response.Error(err)
	}

	var proxy *queries.Connect
	if session.ProxyServerID != 0 {
		p, err := t.DB.FindSession(t.Context, session.ProxyServerID)
		if err != nil {
			return response.Error(err)
		}
		proxy = &p
	}

	dir := messagebox.SelectDirectory(t.Context, filepath.Join(os.Getenv("HOME"), "/Downloads"))
	if dir == "" {
		return response.BadRequest()
	}

	dst := utils.JoinFilename(dir, src)
	task, err := t.Tasker.RunOnBackground(tasker.Task{
		Title:       "下载文件",
		Description: fmt.Sprintf("文件名 %s", dst),
		Command: map[string]any{
			"session_id": id,
			"src":        src,
			"dst":        dst,
		},
	}, func(task queries.Task) error {
		defer t.Message.Success("文件下载成功", fmt.Sprintf("%s -> %s", src, dst))

		conn := ssh.Start(ssh.SSH{
			Config:      session,
			ProxyConfig: proxy,
		})

		download, err := conn.SCPDownload(src, dst)
		if err != nil {
			return err
		}

		return download.Start()
	})
	if err != nil {
		return response.Error(err)
	}

	return response.OK(map[string]string{
		"uuid": task.Uuid,
	})
}

func (t *FileSystemService) UploadFiles(id int64, dst string) *response.Response {
	session, err := t.DB.FindSession(t.Context, id)
	if err != nil {
		return response.Error(err)
	}

	if err = t.DB.StatsIncScpUpload(t.Context); err != nil {
		return response.Error(err)
	}

	if err = t.DB.UpdateSessionUseTime(t.Context, id); err != nil {
		return response.Error(err)
	}

	var proxy *queries.Connect
	if session.ProxyServerID != 0 {
		p, err := t.DB.FindSession(t.Context, session.ProxyServerID)
		if err != nil {
			return response.Error(err)
		}
		proxy = &p
	}

	files := messagebox.SelectFiles(t.Context)
	if files == nil {
		return response.BadRequest()
	}

	task, err := t.Tasker.RunOnBackground(tasker.Task{
		Title:       "上传文件",
		Description: fmt.Sprintf("文件名 %s", files[0]),
		Command: map[string]any{
			"session_id": id,
			"src":        files,
			"dst":        dst,
		},
	}, func(task queries.Task) error {
		defer t.Message.Success("文件上传成功", fmt.Sprintf("%s -> %s", files, dst))

		conn := ssh.Start(ssh.SSH{
			Config:      session,
			ProxyConfig: proxy,
		})

		for _, name := range files {
			upload, err := conn.SCPUpload(name, utils.JoinFilename(dst, name))
			if err != nil {
				return fmt.Errorf("build upload %s failed, error: %v", name, err)
			}

			if err := upload.Start(); err != nil {
				return fmt.Errorf("upload %s failed, error: %v", name, err)
			}
		}
		return nil
	})

	if err != nil {
		return response.Error(err)
	}

	return response.OK(map[string]string{
		"uuid": task.Uuid,
	})
}

func (t *FileSystemService) RemoveFiles() {

}

func (t *FileSystemService) EditFile() {

}

func (t *FileSystemService) SaveFile() {

}

func (t *FileSystemService) CloudDownload() {

}

func (t *FileSystemService) DragUploadFiles() {

}

func (t *FileSystemService) OpenSshSession() {

}
