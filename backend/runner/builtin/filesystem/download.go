package filesystem

import (
	"fmt"
	"os"
	"path"
	"strconv"

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

	s.Logger.Write("src file: %s", s.Params.Src)
	s.Logger.Write("dst file: %s", s.Params.Dst)
	s.Logger.Write("overwrite: %v", s.Params.Overwrite)

	out, err := s.SSH.ExecShellCode(fmt.Sprintf(`stat -c "%%s" %s `, s.Params.Src))
	if err == nil {
		if size, err := strconv.ParseInt(out.String(), 10, 64); err == nil {
			s.Logger.Write("file size: %s (%d)", utils.SizeBeautify(size), size)
		}
	}

	if s.Params.OverwriteIsStop() && utils.UnsafeFileExists(s.Params.Dst) {
		if s.Params.OverwriteIsSkip() {
			s.Logger.Write("skip download: %s", s.Params.Dst)
			return "", nil
		}

		return "", fmt.Errorf("dst %s already exist in remote", s.Params.Dst)
	}

	if s.Params.OverwriteIsStop() && utils.UnsafeFileExists(s.Params.Dst) {
		if s.Params.OverwriteIsSkip() {
			s.Logger.Write("skip download: %s", s.Params.Dst)
			return "", nil
		}

		return "", fmt.Errorf("dst %s already exist in remote", s.Params.Dst)
	}

	if dir := path.Dir(s.Params.Dst); s.Params.AutoMakeDir {
		if err := os.MkdirAll(dir, 0777); err != nil {
			return "", fmt.Errorf("auto mkdir %s failed, error: %v", dir, err)
		}
	}

	return "", s.SSH.SCPDownload(s.Params.Src, s.Params.Dst)
}
