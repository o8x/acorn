package filesystem

import (
	"os"

	"github.com/o8x/acorn/backend/runner/base"
	"github.com/o8x/acorn/backend/runner/constant"
)

type LocalMakeDir struct {
	base.Plugin[constant.MakeDirParams]
}

func (s *LocalMakeDir) Run() (string, error) {
	var err error
	if s.Params.Recursion {
		err = os.MkdirAll(s.Params.Path, 0777)
	} else {
		err = os.Mkdir(s.Params.Path, 0777)
	}

	s.Logger.Write("path: %s", s.Params.Path)
	s.Logger.Write("recursion: %s", s.Params.Recursion)

	return "", err
}
