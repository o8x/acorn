package scripts

import (
	_ "embed"
	"fmt"
	"os/exec"
	"strings"

	"github.com/o8x/acorn/backend/utils"
	"github.com/o8x/acorn/backend/utils/stringbuilder"
)

//go:embed iterm2.applescript
var iterm2Script []byte

type Script struct {
	script   string
	tempFile string
}

type PrepareParams struct {
	Commands string
	Password string
}

func (s *Script) Prepare(p PrepareParams) error {
	var commands = ""
	if p.Commands != "" {
		sb := stringbuilder.Builder{}
		sb.WriteString("#!/bin/sh")
		sb.WriteString("set -ex;")
		sb.WriteString(p.Commands)
		sb.WriteString("unlink $0")
		f, err := utils.WriteTempFileAutoClose(sb.Join("\n\n"))
		if err != nil {
			return err
		}

		commands = fmt.Sprintf("bash %s", f.Name())
	}

	s.script = strings.ReplaceAll(string(iterm2Script), "{password}", p.Password)
	s.script = strings.ReplaceAll(s.script, "{commands}", commands)
	tempFile, err := utils.WriteTempFileAutoClose(s.script)
	if err != nil {
		return err
	}
	s.tempFile = tempFile.Name()
	return nil
}

func (s *Script) Exec() error {
	return exec.Command("osascript", s.tempFile).Start()
}

func (s *Script) Run(p PrepareParams) error {
	if err := s.Prepare(p); err != nil {
		return fmt.Errorf("prepare error: %v", err)
	}

	if err := s.Exec(); err != nil {
		return fmt.Errorf("exec error: %v", err)
	}

	return nil
}
