package runner

import (
	"context"
	"encoding/json"
	"fmt"
	"gopkg.in/yaml.v3"
	"runtime/debug"
	"time"

	"github.com/o8x/acorn/backend/runner/builtin/filesystem"
	"github.com/o8x/acorn/backend/runner/builtin/shell"
	"github.com/o8x/acorn/backend/runner/logger"
	"github.com/o8x/acorn/backend/ssh"
)

type Playbook struct {
	Name  string                   `yaml:"name"`
	Desc  string                   `yaml:"desc"`
	Tasks []map[string]interface{} `yaml:"tasks"`
}

type Runner struct {
	Context  context.Context `json:"context"`
	Playbook []byte          `json:"playbook"`
	SSH      *ssh.SSH        `json:"ssh"`
}

func ParsePlaybook(p string) (*Playbook, error) {
	var pb Playbook
	if err := yaml.Unmarshal([]byte(p), &pb); err != nil {
		return nil, err
	}
	return &pb, nil
}

func (p *Runner) AsyncRunFunc(log *logger.Logger, fn1 func(error)) {
	go func() {
		defer func() {
			if err := recover(); err != nil {
				log.Write("ASYNC PLAY CRASHED")
				log.Write("ERROR: %v", err)
				log.Write("STACK %v", string(debug.Stack()))
			}
		}()

		p.RunFunc(log, fn1)
	}()
}

func (p *Runner) RunFunc(log *logger.Logger, fn1 func(error)) {
	pb, err := ParsePlaybook(string(p.Playbook))
	if err != nil {
		fn1(err)
		return
	}

	fn1(p.run(*pb, log))
}

func (p *Runner) run(pb Playbook, log *logger.Logger) error {
	log.Write("PLAY [%s]", pb.Name)
	log.Write(`TARGET [%s]: "%s@%s:%d"`, p.SSH.Config.Label, p.SSH.Config.Username, p.SSH.Config.Host, p.SSH.Config.Port)

	if p.SSH.ProxyConfig != nil {
		log.Write(`TARGET PROXY [%s]: "%s@%s:%d"`, p.SSH.ProxyConfig.Label, p.SSH.ProxyConfig.Username, p.SSH.ProxyConfig.Host, p.SSH.ProxyConfig.Port)
	}

	now := time.Now()
	defer func() {
		if err := recover(); err != nil {
			log.Write("PLAY [%s] CRASHED", pb.Name)
			log.Write("ERROR: %v", err)
			log.Write("STACK %v", string(debug.Stack()))
		}

		log.Write("PLAY [%s] COMPLETE, TOTAL TIME: %s", pb.Name, time.Now().Sub(now).String())
	}()

	for _, task := range pb.Tasks {
		var (
			name   = task["name"]
			plugin Plugin
			v      any
		)

		if v1, ok := task["builtin.remote.shell"]; ok {
			plugin = &shell.RemoteShell{}
			v = v1
		}

		if v1, ok := task["builtin.local.shell"]; ok {
			plugin = &shell.LocalShell{}
			v = v1
		}

		if v1, ok := task["builtin.remote.fs.delete"]; ok {
			plugin = &filesystem.RemoteDeletePlugin{}
			v = v1
		}

		if v1, ok := task["builtin.local.fs.upload"]; ok {
			plugin = &filesystem.UploadPlugin{}
			v = v1
		}

		if v1, ok := task["builtin.remote.fs.download"]; ok {
			plugin = &filesystem.DownloadPlugin{}
			v = v1
		}

		if v1, ok := task["builtin.remote.fs.copy"]; ok {
			plugin = &filesystem.RemoteCopy{}
			v = v1
		}

		if v1, ok := task["builtin.remote.fs.move"]; ok {
			plugin = &filesystem.RemoteMove{}
			v = v1
		}

		if plugin == nil {
			return fmt.Errorf("plugin not found")
		}

		err := func(pl Plugin) error {
			marshal, _ := json.Marshal(v)
			if err := pl.ParseParams(marshal); err != nil {
				return err
			}

			pl.InjectSSH(p.SSH)
			pl.InjectContext(p.Context)
			pl.InjectLogger(log)

			runNow := time.Now()
			log.Write("TASK [%s] RUNNING", name)
			defer func() {
				log.Write("TASK [%s] COMPLETE, TOTAL TIME: %s", name, time.Now().Sub(runNow).String())
				log.Write("---")
			}()

			if _, err := pl.Run(); err != nil {
				log.Write("ERROR: %v", err)
				return err
			}
			return nil
		}(plugin)

		if err != nil {
			return err
		}
	}

	return nil
}
