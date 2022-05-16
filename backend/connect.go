package backend

import (
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"net"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/o8x/acorn/backend/database"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/utils"
	"github.com/widaT/webssh"
)

//go:embed scripts/iterm2.applescript
var iterm2Script []byte

var bufPool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024 * 10,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Connect struct {
	ctx context.Context
}

func NewConnect() *Connect {
	webssh.NewWebSSH(&webssh.WebSSHConfig{
		Record:     false,
		RemoteAddr: "stdout.com.cn",
		User:       "root",
		Password:   "",
		AuthModel:  webssh.PUBLICKEY,
		PkPath:     "~/.ssh/id_rsa",
	})

	return &Connect{}
}

type ConnectItem struct {
	ID int `json:"id"`
	// 连接类型 linux windows
	Type string `json:"type"`
	// 备注
	Label    string `json:"label"`
	UserName string `json:"username"`
	Password string `json:"password"`
	Port     int    `json:"port"`
	Host     string `json:"host"`
	// 私钥
	PrivateKey string `json:"private_key"`
	// 连接参数 ssh -o
	Params string `json:"params"`
	// 鉴权类型，private_key | password
	AuthType    string    `json:"auth_type"`
	LastUseTime int       `json:"last_use_time"`
	CreateTime  time.Time `json:"create_time"`
}

func (c *Connect) SSHConnect(id int) *response.Response {
	var p ConnectItem
	if err := c.getInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	filename, err := c.makeSSHScript("ssh", p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", filename).Start(); err != nil {
		return response.Error(err)
	}

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) PingConnect(id int) *response.Response {
	var p ConnectItem
	if err := c.getInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	script := strings.ReplaceAll(string(iterm2Script), "{commands}", fmt.Sprintf("ping %s", p.Host))

	f, err := utils.WriteTempFileAutoClose(script)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", f.Name()).Start(); err != nil {
		return response.Error(err)
	}

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) EditConnect(item ConnectItem) error {
	var p ConnectItem
	if err := c.getInfoByID(item.ID, &p); err != nil {
		return err
	}

	stmt, err := database.Get().Prepare("update connect set type = ?, label = ?, username = ?, password = ?, port = ?, host = ?, private_key = ?, params = ?, auth_type = ? where id = ?")
	if err != nil {
		return err
	}

	_, err = stmt.Exec(item.Type, item.Label, item.UserName, item.Password, item.Port, item.Host, item.PrivateKey, item.Params, item.AuthType, item.ID)
	if err != nil {
		return err
	}

	return nil
}

func (c *Connect) SSHCopyID(id int) *response.Response {
	var p ConnectItem
	if err := c.getInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	filename, err := c.makeSSHScript("ssh-copy-id", p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", filename).Start(); err != nil {
		return response.Error(err)
	}
	// TODO 自动退出 item2

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}
	return response.NoContent()
}

func (c *Connect) getInfoByID(id int, p *ConnectItem) error {
	return database.Get().QueryRow("select * from connect where id = ? limit 1", id).
		Scan(&p.ID, &p.Type, &p.Label, &p.UserName, &p.Password, &p.Port, &p.Host, &p.PrivateKey, &p.Params, &p.AuthType, &p.LastUseTime, &p.CreateTime)
}

func (c *Connect) updateLastUseTime(id int) error {
	stmt, err := database.Get().Prepare("update connect set last_use_timestamp = ? where id = ?")
	if err != nil {
		return err
	}
	_, err = stmt.Exec(time.Now().Unix(), id)
	return err
}

func (c *Connect) makeSSHScript(command string, p ConnectItem) (string, error) {
	script := string(iterm2Script)

	if p.AuthType == "private_key" {
		defaultKeyfile := "~/.ssh/id_rsa"
		if p.PrivateKey != "" {
			newKeyfile, err := utils.GenerateSSHPrivateKey(p.PrivateKey)
			if err != nil {
				return "", err
			}
			defaultKeyfile = newKeyfile
		}

		p.Params = strings.Join([]string{p.Params, "-i", defaultKeyfile}, " ")
	}

	cmdline := fmt.Sprintf(`%s %s -p %d %s@%s`, command, p.Params, p.Port, p.UserName, p.Host)
	script = strings.ReplaceAll(script, "{password}", p.Password)
	script = strings.ReplaceAll(script, "{commands}", cmdline)

	f, err := utils.WriteTempFileAutoClose(script)
	if err != nil {
		return "", err
	}

	return f.Name(), nil
}

func (c *Connect) ServeXtermListen(writer http.ResponseWriter, request *http.Request) {
	wsConn, err := upgrader.Upgrade(writer, request, nil)
	if err != nil {
		return
	}

	id := request.URL.Query().Get("id")
	cID, _ := strconv.ParseInt(id, 10, 32)

	var it ConnectItem
	if err = c.getInfoByID(int(cID), &it); err != nil {
		return
	}

	defer wsConn.Close()
	var config = &webssh.SSHClientConfig{
		Timeout:   time.Second * 5,
		AuthModel: webssh.PUBLICKEY,
		HostAddr:  net.JoinHostPort(it.Host, fmt.Sprintf("%d", it.Port)),
		User:      it.UserName,
		Password:  it.Password,
		KeyPath:   `/Users/alex/.ssh/id_rsa`,
	}

	client, err := webssh.NewSSHClient(config)
	if err != nil {
		fmt.Println(err.Error())
		wsConn.WriteControl(websocket.CloseMessage, []byte(err.Error()), time.Now().Add(time.Second))
		return
	}
	defer client.Close()

	turn, err := webssh.NewTurn(wsConn, client, nil)
	if err != nil {
		fmt.Println("turn", err.Error())
		wsConn.WriteControl(websocket.CloseMessage, []byte(err.Error()), time.Now().Add(time.Second))
		return
	}
	defer turn.Close()

	// 更新最后使用时间
	_ = c.updateLastUseTime(int(cID))

	var logBuff = bufPool.Get().(*bytes.Buffer)
	logBuff.Reset()
	defer bufPool.Put(logBuff)

	ctx, cancel := context.WithCancel(context.Background())
	wg := sync.WaitGroup{}
	wg.Add(2)
	go func() {
		defer wg.Done()
		err := turn.LoopRead(logBuff, ctx)
		if err != nil {
			fmt.Println(err)
		}
	}()

	go func() {
		defer wg.Done()
		err := turn.SessionWait()
		if err != nil {
			fmt.Println(err)
		}
		cancel()
	}()
	wg.Wait()
}
