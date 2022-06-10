package utils

import (
	"os"
	"os/exec"
)

func WriteTempFile(content string) (*os.File, error) {
	f, err := os.CreateTemp("", "*")
	if err != nil {
		return nil, err
	}

	_, _ = f.WriteString(content)
	return f, nil
}

func WriteTempFileAutoClose(content string) (*os.File, error) {
	file, err := WriteTempFile(content)
	if err != nil {
		return nil, err
	}
	return file, file.Close()
}

func GenerateSSHPrivateKey(content string) (string, error) {
	f, err := WriteTempFileAutoClose(content)
	if err != nil {
		return "", err
	}

	return f.Name(), exec.Command("chmod", "600", f.Name()).Run()
}

func UnsafeFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
