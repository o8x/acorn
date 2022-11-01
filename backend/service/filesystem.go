package service

import "path/filepath"

type FileSystemService struct {
	*Service
}

func (t *FileSystemService) CleanPath(path string) string {
	return filepath.Clean(path)
}

func (t *FileSystemService) ListDir() {

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
