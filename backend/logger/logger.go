package logger

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

var l logger.Logger

func init() {
	s := os.Args[0]
	dir, _ := filepath.Split(s)
	filename := filepath.Join(dir, "acorn.log")
	logger.NewDefaultLogger().Info(fmt.Sprintf("log file: %s", filename))

	l = logger.NewFileLogger(filename)
}

func Info(f string, message ...any) {
	l.Info(fmt.Sprintf(f, message...))
}

func Warn(f string, message ...any) {
	l.Warning(fmt.Sprintf(f, message...))
}

func Error(err error) {
	if err != nil {
		l.Error(err.Error())
	}
}

func Fatal(f string, message ...any) {
	l.Fatal(fmt.Sprintf(f, message...))
}
