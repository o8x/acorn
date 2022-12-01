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

var table = []string{
	"builtin.shell",
	"builtin.file.remote_delete",
	"builtin.file.upload",
	"builtin.remote_copy",
	"builtin.notification",
}

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
	pb, err := ParsePlaybook(string(p.Playbook))
	if err != nil {
		fn1(err)
		return
	}

	go func() {
		fn1(p.run(*pb, log))
	}()
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
			v      []byte
		)

		for _, k := range table {
			if args, ok := task[k]; ok {
				v, _ = json.Marshal(args)
				switch k {
				case "builtin.shell":
					plugin = &shell.Plugin{}
				case "builtin.file.remote_delete":
					plugin = &filesystem.RemoteDeletePlugin{}
				case "builtin.file.upload":
					plugin = &filesystem.UploadPlugin{}
				case "builtin.file.download":
					plugin = &filesystem.DownloadPlugin{}
				case "builtin.remote_copy":
				case "builtin.notification":
				default:
					return fmt.Errorf("plugin not found")
				}
				break
			}
		}

		err := func(pl Plugin) error {
			if plugin == nil {
				return nil
			}

			if err := pl.ParseParams(v); err != nil {
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
