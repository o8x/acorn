package backend

import (
	"context"
	_ "embed"
	"encoding/base64"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/o8x/acorn/backend/database"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/utils"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed scripts/iterm2.applescript
var iterm2Script []byte

//go:embed scripts/rdp.applescript
var rdpScript []byte

type Connect struct {
	ctx context.Context
}

func NewConnect() *Connect {
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
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}

	if p.Type == "windows" {
		return c.RDPConnect(p)
	}

	filename, err := c.makeSSHScript("ssh", p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", filename).Start(); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func CreateRDPFile(it ConnectItem) (string, error) {
	f, err := os.CreateTemp("", "*.rdp")
	if err != nil {
		return "", err
	}

	l1 := fmt.Sprintf("full address:s:%s:%d\n", it.Host, it.Port)
	l2 := fmt.Sprintf("username:s:%s\n", it.UserName)

	_, _ = f.WriteString(l1)
	_, _ = f.WriteString(l2)
	_, _ = f.WriteString("screen mode id:i:2\n")
	_, _ = f.WriteString("session bpp:i:24\n")
	_, _ = f.WriteString("use multimon:i:0\n")
	_, _ = f.WriteString("redirectclipboard:i:1")

	if err = f.Close(); err != nil {
		return "", err
	}

	return f.Name(), nil
}

func CreateRDPScript(file string, password string) (string, error) {
	contents := string(rdpScript)
	contents = strings.ReplaceAll(contents, "{rdp_file}", file)
	contents = strings.ReplaceAll(contents, "{password}", password)

	f, err := os.CreateTemp("", "*.applescript")
	if err != nil {
		return "", err
	}

	_, _ = f.WriteString(contents)
	if err = f.Close(); err != nil {
		return "", err
	}

	return f.Name(), nil
}

func (c *Connect) RDPConnect(p ConnectItem) *response.Response {
	file, err := CreateRDPFile(p)
	if err != nil {
		return response.Error(err)
	}

	script, err := CreateRDPScript(file, p.Password)
	if err != nil {
		return response.Error(err)
	}

	script = strings.ReplaceAll(string(iterm2Script), "{commands}", fmt.Sprintf(`osascript %s`, script))

	f, err := utils.WriteTempFileAutoClose(script)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", f.Name()).Start(); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) PingConnect(id int) *response.Response {
	var p ConnectItem
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	script := strings.ReplaceAll(string(iterm2Script), "{commands}", fmt.Sprintf("ping -c 10 %s", p.Host))

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

func (c *Connect) OpenLocalConsole() *response.Response {
	script := strings.ReplaceAll(string(iterm2Script), "{commands}", "")
	f, err := utils.WriteTempFileAutoClose(script)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", f.Name()).Start(); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) SCPDownload(ctx context.Context, id int, file string) *response.Response {
	var p ConnectItem
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	dir, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{
		DefaultDirectory:     filepath.Join(os.Getenv("HOME"), "/Downloads"),
		Title:                "选择下载目录",
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
		ResolvesAliases:      true,
	})
	if dir = strings.TrimSpace(dir); dir == "" || err != nil {
		return response.Error(fmt.Errorf("所选目录无效"))
	}

	script, err := c.MakeSCPDownloadCommand(file, dir, p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", script).Start(); err != nil {
		return response.Error(err)
	}

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) SCPUpload(ctx context.Context, id int, dir string) *response.Response {
	var p ConnectItem
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	sFile, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
		Title:                "选择需要上传的文件",
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
	})
	if sFile = strings.TrimSpace(sFile); sFile == "" || err != nil {
		return response.Error(fmt.Errorf("所选文件无效"))
	}

	script, err := c.MakeSCPUploadCommand(sFile, dir, p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", script).Start(); err != nil {
		return response.Error(err)
	}

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) SCPUploadBase64(id int, dir, filename, b64 string) *response.Response {
	var p ConnectItem
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	temp, err := os.Create(filepath.Join(os.TempDir(), filename))
	if err != nil {
		return response.Error(err)
	}

	bs, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return response.Error(err)
	}

	if _, err := temp.Write(bs); err != nil {
		return response.Error(err)
	}

	script, err := c.MakeSCPUploadCommand(temp.Name(), dir, p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", script).Start(); err != nil {
		return response.Error(err)
	}

	if err := c.updateLastUseTime(id); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) CloudDownload(id int, dir, link string) *response.Response {
	var p ConnectItem
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	l, err := url.Parse(link)
	if err != nil {
		return response.Error(err)
	}

	_, file := filepath.Split(l.Path)
	if file == "" {
		return response.Error(fmt.Errorf("无法解析文件名(%s)", l.Path))
	}

	script, err := c.MakeCloudDownloadCommand(link, filepath.Join(dir, file), p)
	if err != nil {
		return response.Error(err)
	}

	fmt.Println(script)

	if err = exec.Command("osascript", script).Start(); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) EditConnect(item ConnectItem) error {
	var p ConnectItem
	if err := GetInfoByID(item.ID, &p); err != nil {
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
	if err := GetInfoByID(id, &p); err != nil {
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

func GetInfoByID(id int, p *ConnectItem) error {
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
	cmdline := fmt.Sprintf(`%s {params} -p %d %s@%s`, command, p.Port, p.UserName, p.Host)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) MakeSCPDownloadCommand(from, to string, p ConnectItem) (string, error) {
	from, err := filepath.Abs(from)
	if err != nil {
		return "", err
	}

	cmdline := fmt.Sprintf(`scp -r {params} -P %d '%s@%s:%s' '%s'`, p.Port, p.UserName, p.Host, from, to)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) MakeSCPUploadCommand(from, to string, p ConnectItem) (string, error) {
	cmdline := fmt.Sprintf(`scp -r {params} -P %d '%s' '%s@%s:%s'`, p.Port, from, p.UserName, p.Host, to)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) MakeCloudDownloadCommand(link, file string, p ConnectItem) (string, error) {
	cmdline := fmt.Sprintf("ssh {params} -p %d %s@%s curl -o %s '%s'", p.Port, p.UserName, p.Host, file, link)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) CreateScript(cmdline string, autoClose bool, p ConnectItem) (string, error) {
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

	cmdline = strings.ReplaceAll(cmdline, "{params}", p.Params)
	script = strings.ReplaceAll(script, "{password}", p.Password)
	script = strings.ReplaceAll(script, "{commands}", cmdline)
	script = strings.ReplaceAll(script, "{auto_close}", fmt.Sprintf("%v", autoClose))

	f, err := utils.WriteTempFileAutoClose(script)
	if err != nil {
		return "", err
	}

	return f.Name(), nil
}
