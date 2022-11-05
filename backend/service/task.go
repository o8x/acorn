package service

import (
	"github.com/o8x/acorn/backend/response"
)

type TaskService struct {
	*Service
}

func (t *TaskService) Create() *response.Response {
	return response.OK(nil)
}

func (t *TaskService) ListAll() *response.Response {
	tasks, err := t.DB.GetTasks(t.Context)
	if err != nil {
		return response.Error(err)
	}

	return response.OK(tasks)
}

func (t *TaskService) ListNormal() *response.Response {
	tasks, err := t.DB.GetNormalTasks(t.Context)
	if err != nil {
		return response.Error(err)
	}

	return response.OK(tasks)
}

func (t *TaskService) Cancel(id int) *response.Response {
	if err := t.DB.TaskCancel(t.Context, int64(id)); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}
