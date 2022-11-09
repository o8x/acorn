package scripts

import (
	_ "embed"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/o8x/acorn/backend/utils"
)

//go:embed iterm2.applescript
var iterm2Script []byte

func Create(commands string) (string, error) {
	script := string(iterm2Script)

	temp, err := os.CreateTemp("", "")
	if _, err := temp.WriteString("set -ex;\n"); err != nil {
		return "", err
	}

	if _, err := temp.WriteString(commands); err != nil {
		return "", err
	}

	_ = temp.Sync()
	_ = temp.Close()

	script = strings.ReplaceAll(script, "{commands}", fmt.Sprintf("bash %s", temp.Name()))
	f, err := utils.WriteTempFileAutoClose(script)
	if err != nil {
		return "", err
	}

	return f.Name(), nil
}

func Exec(file string) error {
	return exec.Command("osascript", file).Start()
}

func Run(command string) error {
	script, err := Create(command)
	if err != nil {
		return err
	}

	return Exec(script)
}
