package service

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/service/tasker"
)

type Message struct {
	Context context.Context
}

func (m Message) Success(title, message string) {
	runtime.EventsEmit(m.Context, "message", map[string]string{
		"type":    "success",
		"title":   title,
		"message": message,
	})
}

func (m Message) Error(title, message string) {
	runtime.EventsEmit(m.Context, "message", map[string]string{
		"type":    "error",
		"title":   title,
		"message": message,
	})
}

func (m Message) Warning(title, message string) {
	runtime.EventsEmit(m.Context, "message", map[string]string{
		"type":    "warning",
		"title":   title,
		"message": message,
	})
}

func (m Message) Info(title, message string) {
	runtime.EventsEmit(m.Context, "message", map[string]string{
		"type":    "info",
		"title":   title,
		"message": message,
	})
}

type Service struct {
	DB      *model.Queries
	Context context.Context
	Tasker  *tasker.Tasker
	Message *Message
}
