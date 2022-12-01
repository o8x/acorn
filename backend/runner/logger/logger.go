package logger

import (
	"io"
	"log"
)

type Logger struct {
	logger *log.Logger
}

func Default() *Logger {
	return &Logger{
		logger: log.Default(),
	}
}

func New(writer io.Writer) *Logger {
	return &Logger{
		logger: log.New(writer, "", log.LstdFlags),
	}
}

func NewFunc(writeFunc WriteFunc) *Logger {
	return &Logger{
		logger: log.New(Writer{WriteFunc: writeFunc}, "", log.LstdFlags),
	}
}

func (l Logger) Write(format string, values ...any) {
	l.logger.Printf(format, values...)
}
