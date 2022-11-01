package service

import "github.com/o8x/acorn/backend/response"

type TaskService struct {
	*Service
}

func (t *TaskService) Create() *response.Response {
	return response.OK(nil)
}

func (t *TaskService) List() *response.Response {
	return response.OK(nil)
}

func (t *TaskService) Cancel() *response.Response {
	return response.OK(nil)
}
