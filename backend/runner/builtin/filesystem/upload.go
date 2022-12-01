package filesystem

import (
	"fmt"
	"strings"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
	"github.com/o8x/acorn/backend/utils/messagebox"
)

type UploadPlugin struct {
	base.Plugin[constant.FileTransferParams]
}

func (s *UploadPlugin) Run() (string, error) {
	if s.Params.Src == "$select" {
		s.Params.Src = messagebox.SelectFile(s.Context)
	}

	if strings.HasPrefix(s.Params.Src, "$url::") {
		return "", fmt.Errorf("unspported")
	}

	if s.Params.Src == "" {
		return "", fmt.Errorf("%s: no such file or directory", s.Params.Src)
	}

	if !s.Params.Overwrite && s.RemoteFileExist(s.Params.Dst) {
		return "", fmt.Errorf("dst %s already exist in remote", s.Params.Dst)
	}

	s.Logger.Write("src file: %s", s.Params.Src)
	s.Logger.Write("dst file: %s", s.Params.Dst)
	s.Logger.Write("overwrite: %v", s.Params.Overwrite)

	return "", s.SSH.SCPUpload(s.Params.Src, s.Params.Dst)
}
