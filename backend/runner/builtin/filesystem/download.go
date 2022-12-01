package filesystem

import (
	"fmt"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
	"github.com/o8x/acorn/backend/utils"
	"github.com/o8x/acorn/backend/utils/messagebox"
)

type DownloadPlugin struct {
	base.Plugin[constant.FileTransferParams]
}

func (s *DownloadPlugin) Run() (string, error) {
	if s.Params.Dst == "$select" {
		s.Params.Dst = messagebox.SelectDirectory(s.Context, "~/Download")
	}

	if s.Params.Dst == "" {
		return "", fmt.Errorf("%s: no such file or directory", s.Params.Src)
	}

	if !s.Params.Overwrite && utils.UnsafeFileExists(s.Params.Dst) {
		return "", fmt.Errorf("dst %s already exist in remote", s.Params.Dst)
	}

	s.Logger.Write("src file: %s", s.Params.Src)
	s.Logger.Write("dst file: %s", s.Params.Dst)
	s.Logger.Write("overwrite: %v", s.Params.Overwrite)

	return "", s.SSH.SCPDownload(s.Params.Src, s.Params.Dst)
}
