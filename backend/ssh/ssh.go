package ssh

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/appleboy/easyssh-proxy"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"

	"github.com/o8x/acorn/backend/database/queries"
	"github.com/o8x/acorn/backend/utils/iocopy"
)

var (
	AuthModePassword = "password"
	AuthModeKey      = "private_key"
)

type SSH struct {
	Config      queries.Connect  `json:"session"`
	ProxyConfig *queries.Connect `json:"proxy_server"`
	client      *ssh.Client
	session     *ssh.Session
}

var (
	connections = Connections{
		connections: sync.Map{},
	}
)

func Start(c SSH) *SSH {
	if conn := connections.Get(&c); conn != nil {
		return conn
	}

	connections.Add(&c)
	return &c
}

func (conn *SSH) Close() error {
	defer func() {
		conn.client = nil
	}()

	connections.Remove(conn)
	return conn.client.Close()
}

func (conn *SSH) Connect() error {
	if conn.client != nil {
		return nil
	}

	homeDir, _ := os.UserHomeDir()
	keyPath := filepath.Join(homeDir, ".ssh", "id_rsa")

	ssh := &easyssh.MakeConfig{
		Server:  conn.Config.Host,
		User:    conn.Config.Username,
		Port:    fmt.Sprintf("%d", conn.Config.Port),
		Timeout: time.Second * 5,
	}

	if conn.Config.PrivateKey != "" {
		ssh.Key = conn.Config.PrivateKey
	} else if conn.Config.AuthType == AuthModePassword {
		ssh.Password = conn.Config.Password
	} else if conn.Config.AuthType == AuthModeKey {
		ssh.KeyPath = keyPath
	}

	if conn.ProxyConfig != nil {
		ssh.Proxy = easyssh.DefaultConfig{
			Server:  conn.ProxyConfig.Host,
			User:    conn.ProxyConfig.Username,
			Port:    fmt.Sprintf("%d", conn.ProxyConfig.Port),
			Timeout: time.Second * 10,
		}

		if conn.ProxyConfig.PrivateKey != "" {
			ssh.Proxy.Key = conn.ProxyConfig.PrivateKey
		} else if conn.ProxyConfig.AuthType == AuthModePassword {
			ssh.Proxy.Password = conn.ProxyConfig.Password
		} else if conn.ProxyConfig.AuthType == AuthModeKey {
			ssh.Proxy.KeyPath = keyPath
		}
	}

	session, client, err := ssh.Connect()
	conn.session = session
	conn.client = client
	return err
}

func (conn *SSH) GetClient() *ssh.Client {
	if err := conn.Connect(); err != nil {
		return nil
	}

	return conn.client
}

func (conn *SSH) SCPUpload(srcName, dstName string) (*iocopy.IOCopy, error) {
	client, err := sftp.NewClient(conn.GetClient())
	if err != nil {
		return nil, err
	}
	defer client.Close()

	src, err := os.OpenFile(srcName, os.O_RDONLY, 0777)
	if err != nil {
		return nil, err
	}

	dst, err := client.OpenFile(dstName, os.O_WRONLY|os.O_CREATE|os.O_TRUNC)
	if err != nil {
		return nil, err
	}

	return iocopy.New(src, dst), nil
}

func (conn *SSH) SCPDownload(srcName string, dstName string) (*iocopy.IOCopy, error) {
	client, err := sftp.NewClient(conn.GetClient())
	if err != nil {
		return nil, err
	}
	defer client.Close()

	dst, err := os.OpenFile(dstName, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0775)
	if err != nil {
		return nil, err
	}

	src, err := client.OpenFile(srcName, os.O_RDONLY)
	if err != nil {
		return nil, err
	}

	return iocopy.New(dst, src), nil
}

func (conn *SSH) OpenSession(retry bool) error {
	if err := conn.Connect(); err != nil {
		return err
	}

	s1, err := conn.client.NewSession()
	if err != nil {
		if !retry {
			return err
		}

		// 注销连接再重建
		if err := conn.Close(); err != nil {
			fmt.Println(err)
		}

		if err := conn.Connect(); err != nil {
			return err
		}
		return conn.OpenSession(false)
	}
	conn.session = s1
	return nil
}

func (conn *SSH) ExecPythonCode(py []byte) (*bytes.Buffer, error) {
	hash := sha1.Sum(py)
	filename := fmt.Sprintf("/tmp/%x", hash)
	buf, err := conn.WriteFile(filename, py)
	if err != nil {
		return nil, err
	}

	cmd := fmt.Sprintf(`python3 %s 2>/tmp/py3.error || python %s 2>/tmp/py2.error`, filename, filename)
	if buf, err = conn.ExecShellCode(cmd); err != nil {
		return nil, err
	}

	return buf, nil
}

func (conn *SSH) WriteFile(name string, content []byte) (*bytes.Buffer, error) {
	b64 := base64.StdEncoding.EncodeToString(content)
	buf, err := conn.ExecShellCode(fmt.Sprintf(`echo '%s' | base64 -d >%s`, b64, name))
	if err != nil {
		return nil, err
	}
	return buf, nil
}

func (conn *SSH) ExecShellCode(code string) (*bytes.Buffer, error) {
	if err := conn.OpenSession(true); err != nil {
		return nil, nil
	}

	output, err := conn.session.CombinedOutput(code)
	if err != nil {
		return bytes.NewBuffer(output), err
	}

	_ = conn.session.Close()
	return bytes.NewBuffer(output), nil
}

func (conn *SSH) CloseSession() error {
	return conn.client.Close()
}
