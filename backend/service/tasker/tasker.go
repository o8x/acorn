package tasker

import (
	"context"
	"encoding/json"

	"github.com/o8x/acorn/backend/database/queries"
)

const (
	StatusRunning  = "running"
	StatusSuccess  = "success"
	StatusError    = "error"
	StatusExpired  = "expired"
	StatusTimeout  = "timeout"
	StatusCanceled = "canceled"
)

type Task struct {
	Title       string `json:"title"`
	Command     any    `json:"command"`
	Description string `json:"description"`
}

type Tasker struct {
	Context context.Context
	DB      *queries.Queries
}

func (t Tasker) RunOnBackground(params Task, fn func(queries.Task) error) (queries.Task, error) {
	commands, _ := json.Marshal(params.Command)
	task, err := t.DB.CreateTask(t.Context, queries.CreateTaskParams{
		Title:       params.Title,
		Command:     string(commands),
		Description: params.Description,
	})
	if err != nil {
		return task, err
	}

	go func() {
		if err := fn(task); err != nil {
			_ = t.DB.TaskError(t.Context, queries.TaskErrorParams{
				ID:     task.ID,
				Result: err.Error(),
			})
		} else {
			_ = t.DB.TaskSuccess(t.Context, task.ID)
		}
	}()

	return task, nil
}
