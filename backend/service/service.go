package service

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend/database/queries"
	"github.com/o8x/acorn/backend/service/tasker"
	"github.com/o8x/acorn/backend/utils/syncmap"
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

type Hooks struct {
	*syncmap.Map[func()]
}

func NewHooks() *Hooks {
	return &Hooks{
		syncmap.New[func()](),
	}
}

func (h Hooks) Exec(name string) {
	if h.Exist(name) {
		h.Load(name)()
	}
}

type Service struct {
	DB      *queries.Queries
	Context context.Context
	Tasker  *tasker.Tasker
	Hooks   *Hooks
	Message *Message
}
