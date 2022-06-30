package ssh

import (
	"bytes"
	"crypto/sha1"
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
	buf := &bytes.Buffer{}
	conn.session.Stdout = buf

	hash := sha1.Sum(py)
	cmd := fmt.Sprintf(`
cat > /tmp/%x <<EOF
%s
EOF
python3 /tmp/%x || python /tmp/%x`, hash, py, hash, hash)
	if err := conn.session.Run(cmd); err != nil {
		return nil, err
	}

	return buf, nil
}

func (conn *Connection) CloseSession() error {
	return conn.client.Close()
}
