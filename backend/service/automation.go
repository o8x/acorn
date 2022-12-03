package service

import (
	"fmt"

	"github.com/o8x/acorn/backend/database/queries"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/runner"
	"github.com/o8x/acorn/backend/runner/logger"
	"github.com/o8x/acorn/backend/service/tasker"
	"github.com/o8x/acorn/backend/ssh"
)

type AutomationService struct {
	*Service
}

func (t *AutomationService) GetAutomations() *response.Response {
	playbooks, err := t.DB.GetAutomations(t.Context)
	if err != nil {
		return response.Error(err)
	}

	return response.OK(playbooks)
}

func (t *AutomationService) DeleteAutomation(id int64) *response.Response {
	if err := t.DB.DeleteAutomation(t.Context, id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (t *AutomationService) GetAutomationLogs(id int64) *response.Response {
	logs, err := t.DB.GetAutomationLogs(t.Context, id)
	if err != nil {
		return response.Error(err)
	}

	return response.OK(logs)
}

func (t *AutomationService) UpdateAutomation(id int64, playbook queries.Automation) *response.Response {
	pb, err := runner.ParsePlaybook(playbook.Playbook)
	if err != nil {
		return response.Error(err)
	}

	err = t.DB.UpdateAutomation(t.Context, queries.UpdateAutomationParams{
		Playbook: playbook.Playbook,
		Name:     pb.Name,
		Desc:     pb.Desc,
		ID:       id,
	})
	if err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (t *AutomationService) CreateAutomation(automation queries.Automation) *response.Response {
	pb, err := runner.ParsePlaybook(automation.Playbook)
	if err != nil {
		return response.Error(err)
	}

	err = t.DB.CreateAutomation(t.Context, queries.CreateAutomationParams{
		Playbook: automation.Playbook,
		Name:     pb.Name,
		Desc:     pb.Desc,
	})
	if err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (t *AutomationService) RunAutomation(id, sessionID int64) *response.Response {
	data, err := t.DB.FindAutomation(t.Context, id)
	if err != nil {
		return response.Error(err)
	}

	sess, err := t.DB.FindSession(t.Context, sessionID)
	if err != nil {
		return response.Error(err)
	}

	logID, err := t.DB.CreateAutomationLog(t.Context, id)
	if err != nil {
		return response.Error(err)
	}

	go func() {
		r := runner.Runner{
			Context:  t.Context,
			Playbook: []byte(data.Playbook),
			SSH:      ssh.Start(ssh.SSH{Config: sess}),
		}

		_, err := t.Tasker.RunOnBackground(tasker.Task{
			Title:       fmt.Sprintf("运行自动化 [%s]", data.Name),
			Command:     data.Playbook,
			Description: data.Desc,
		}, func(task queries.Task) (e error) {
			r.RunFunc(logger.NewFunc(func(s string) error {
				return t.DB.AppendAutomationLog(t.Context, queries.AppendAutomationLogParams{
					Contents: s,
					ID:       logID,
				})
			}), func(err error) {
				if err != nil {
					t.Message.Error(fmt.Sprintf("自动化 [%s] 执行失败", data.Name), err.Error())
				} else {
					t.Message.Success(fmt.Sprintf("自动化 [%s] 执行成功", data.Name), "")
				}

				e = err
			})
			return
		})

		if err != nil {
			t.Message.Error(fmt.Sprintf("自动化 [%s] 生成失败", data.Name), err.Error())
		}
	}()

	return response.NoContent()
}

func (t *AutomationService) Create() *response.Response {
	return response.OK(nil)
}
