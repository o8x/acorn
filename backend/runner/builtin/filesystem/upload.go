package filesystem

import (
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
	utils2 "github.com/o8x/acorn/backend/runner/utils"
	"github.com/o8x/acorn/backend/utils"
	"github.com/o8x/acorn/backend/utils/iocopy"
	"github.com/o8x/acorn/backend/utils/messagebox"
)

type UploadPlugin struct {
	base.Plugin[constant.FileTransferParams]
}

func (s *UploadPlugin) Run() (string, error) {
	s.Params.Src = utils2.FillEnv(s.Params.Src)

	if s.Params.Src == "$select" {
		s.Params.Src = messagebox.SelectFile(s.Context)
	}

	if strings.HasPrefix(s.Params.Src, "$url::") {
		return "", fmt.Errorf("unspported")
	}

	if s.Params.Src == "" {
		return "", fmt.Errorf("%s: no such file or directory", s.Params.Src)
	}

	s.Logger.Write("src file: %s", s.Params.Src)
	stat, err := os.Stat(s.Params.Src)
	if err == nil {
		s.Logger.Write("file size: %s (%d)", utils.SizeBeautify(stat.Size(), 2), stat.Size())
	}

	s.Logger.Write("dst file: %s", s.Params.Dst)
	s.Logger.Write("overwrite: %v", s.Params.Overwrite)

	if s.Params.OverwriteIsStop() && s.RemoteFileExist(s.Params.Dst) {
		if s.Params.OverwriteIsSkip() {
			s.Logger.Write("skip upload: %s", s.Params.Dst)
			return "", nil
		}

		return "", fmt.Errorf("dst %s already exist in remote", s.Params.Dst)
	}

	if dir := path.Dir(s.Params.Dst); s.Params.AutoMakeDir && s.RemoteMakeDir(dir) {
		return "", fmt.Errorf("auto mkdir %s failed on remote", dir)
	}

	upload, err := s.SSH.SCPUpload(s.Params.Src, s.Params.Dst)
	if err != nil {
		return "", err
	}

	upload.ProcessBar(iocopy.DefaultProcessBar(s.Logger))
	return "", upload.Start()
}
