package ssh

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"os"
	"time"

	"golang.org/x/crypto/ssh"
)

var (
	AuthModePassword = "password"
	AuthModeKey      = "private_key"
)

type Connection struct {
	Host       string `json:"host"`
	User       string `json:"user"`
	Port       int    `json:"port"`
	Password   string `json:"password"`
	AuthMethod string `json:"auth_method"`
	client     *ssh.Client
	session    *ssh.Session
}

var (
	connections = Connections{}
)

func New(c Connection) *Connection {
	if conn := connections.Get(c); conn != nil {
		return conn
	}

	connections.Add(&c)
	return &c
}

func (conn *Connection) Close() error {
	defer func() {
		conn.client = nil
	}()

	connections.Remove(*conn)
	return conn.client.Close()
}

func (conn *Connection) Connect() error {
	if conn.client != nil {
		return nil
	}

	config := &ssh.ClientConfig{
		User:            conn.User,
		Timeout:         time.Second * 10,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	if conn.AuthMethod == AuthModePassword {
		config.Auth = []ssh.AuthMethod{ssh.Password(conn.Password)}
	} else {
		key, err := os.ReadFile(fmt.Sprintf(`%s/.ssh/id_rsa`, os.Getenv("HOME")))
		if err != nil {
			return err
		}

		signer, err := ssh.ParsePrivateKey(key)
		if err != nil {
			return err
		}

		config.Auth = []ssh.AuthMethod{ssh.PublicKeys(signer)}
	}

	if conn.Port == 0 {
		conn.Port = 22
	}

	dial, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", conn.Host, conn.Port), config)
	if err != nil {
		return err
	}

	conn.client = dial
	return err
}

func (conn *Connection) OpenSession(retry bool) error {
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

func (conn *Connection) ExecPythonCode(py []byte) (*bytes.Buffer, error) {
	hash := sha1.Sum(py)
	filename := fmt.Sprintf("/tmp/%x", hash)
	buf, err := conn.WriteFile(filename, py)
	if err != nil {
		return nil, err
	}

	cmd := fmt.Sprintf(`python3 %s || python %s`, filename, filename)
	if buf, err = conn.ExecShellCode(cmd); err != nil {
		return nil, err
	}

	return buf, nil
}

func (conn *Connection) WriteFile(name string, content []byte) (*bytes.Buffer, error) {
	b64 := base64.StdEncoding.EncodeToString(content)
	buf, err := conn.ExecShellCode(fmt.Sprintf(`echo '%s' | base64 -d >%s`, b64, name))
	if err != nil {
		return nil, err
	}
	return buf, nil
}

func (conn *Connection) ExecShellCode(code string) (*bytes.Buffer, error) {
	if err := conn.OpenSession(true); err != nil {
		return nil, nil
	}

	buf := &bytes.Buffer{}
	conn.session.Stdout = buf

	if err := conn.session.Run(code); err != nil {
		return nil, err
	}
	fmt.Println("run code:", code, "output:", buf.String())

	_ = conn.session.Close()
	return buf, nil
}

func (conn *Connection) CloseSession() error {
	return conn.client.Close()
}
