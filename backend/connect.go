package app

import (
	"context"
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
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
	"gopkg.in/yaml.v3"
)

//go:embed scripts/iterm2.applescript
var iterm2Script []byte

const (
	ConnectSSHStatsKey      = "connect_sum_count"
	ConnectRDPStatsKey      = "connect_rdp_sum_count"
	PingStatsKey            = "ping_sum_count"
	TopStatsKey             = "top_sum_count"
	ScpUploadStatsKey       = "scp_upload_sum_count"
	ScpUploadBase64StatsKey = "scp_upload_base64_sum_count"
	ScpDownStatsKey         = "scp_download_sum_count"
	ScpCloudDownStatsKey    = "scp_cloud_download_sum_count"
	LocalITermStatsKey      = "local_iterm_sum_count"
	LoadRDPStatsKey         = "import_rdp_sum_count"
	FileTransferStatsKey    = "file_transfer_sum_count"
	CopyIDStatsKey          = "copy_id_sum_count"
	EditFileStatsKey        = "edit_file_sum_count"
	DeleteFileStatsKey      = "delete_file_sum_count"
)

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
	AuthType      string        `json:"auth_type"`
	ProxyServerID int           `json:"proxy_server_id"`
	LastUseTime   int           `json:"last_use_time"`
	CreateTime    time.Time     `json:"create_time"`
	Workdir       string        `json:"-" yaml:"-"`
	Tags          []interface{} `json:"tags"`
	TagsString    string        `json:"tags_string"`
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

	if err := database.IntValueInc(ScpUploadBase64StatsKey); err != nil {
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

	if err := database.IntValueInc(ScpCloudDownStatsKey); err != nil {
		return response.Error(err)
	}

	script, err := c.MakeCloudDownloadCommand(link, filepath.Join(dir, file), p)
	if err != nil {
		return response.Error(err)
	}

	if err = exec.Command("osascript", script).Start(); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (c *Connect) SSHCopyID(id int) *response.Response {
	var p ConnectItem
	if err := GetInfoByID(id, &p); err != nil {
		return response.Error(err)
	}

	if err := database.IntValueInc(CopyIDStatsKey); err != nil {
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
		Scan(&p.ID, &p.Type, &p.Label, &p.UserName, &p.Password, &p.Port, &p.Host, &p.PrivateKey, &p.PrivateKey, &p.TagsString, &p.Params, &p.AuthType, &p.LastUseTime, &p.CreateTime)
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
	if p.Workdir != "" {
		return c.makeTTYScript(fmt.Sprintf("cd %s; $SHELL", p.Workdir), p)
	}

	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) makeTTYScript(command string, p ConnectItem) (string, error) {
	cmdline := fmt.Sprintf(`ssh {params} -t -p %d %s@%s '%s'`, p.Port, p.UserName, p.Host, command)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) MakeSCPDownloadCommand(from, to string, p ConnectItem) (string, error) {
	from, err := filepath.Abs(from)
	if err != nil {
		return "", err
	}

	cmdline := fmt.Sprintf(`scp -r {params} -P %d '%s@%s:%s' '%s' && exit`, p.Port, p.UserName, p.Host, from, to)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) MakeSCPUploadCommand(from, to string, p ConnectItem) (string, error) {
	cmdline := fmt.Sprintf(`scp -r {params} -P %d %s '%s@%s:%s' && exit`, p.Port, from, p.UserName, p.Host, to)
	return c.CreateScript(cmdline, false, p)
}

func (c *Connect) MakeCloudDownloadCommand(link, file string, p ConnectItem) (string, error) {
	cmdline := fmt.Sprintf("ssh {params} -p %d %s@%s curl -o %s '%s' && exit", p.Port, p.UserName, p.Host, file, link)
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

func (c *Connect) importRDPFile(ctx context.Context) *response.Response {
	rdp, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
		DefaultDirectory:     filepath.Join(os.Getenv("HOME"), "/Downloads"),
		Title:                "选择RDP文件",
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
		ResolvesAliases:      true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "RDP文件 (*.rdp)",
				Pattern:     "*.rdp",
			},
		},
	})

	if rdp = strings.TrimSpace(rdp); rdp == "" || err != nil {
		return response.Error(fmt.Errorf("所选文件无效"))
	}

	if !utils.UnsafeFileExists(rdp) {
		return response.Error(fmt.Errorf("%s文件不存在", rdp))
	}

	content, err := os.ReadFile(rdp)
	if err != nil {
		return response.Error(fmt.Errorf("%s文件解析失败: %s", rdp, err.Error()))
	}

	var (
		host     = ""
		port     = ""
		username = ""
		label    = ""
	)

	for _, it := range strings.Split(string(content), "\n") {
		if strings.Contains(it, "full address:s:") {
			host, port, _ = net.SplitHostPort(strings.TrimPrefix(it, "full address:s:"))
		}

		if strings.Contains(it, "username:s:") {
			username = strings.TrimPrefix(it, "username:s:")
		}
	}

	if err := database.IntValueInc(LoadRDPStatsKey); err != nil {
		return response.Error(err)
	}

	stmt, err := database.Get().Prepare(`insert into connect (type, label, username, port, host, params, auth_type) values (?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		return response.Error(fmt.Errorf("SQL构造失败: %s", err.Error()))
	}

	_, label = filepath.Split(rdp)
	if _, err := stmt.Exec("windows", strings.TrimSuffix(label, ".rdp"), username, port, host, "", "password"); err != nil {
		return response.Error(fmt.Errorf("插入失败: %s", err.Error()))
	}

	return response.NoContent()
}

func (c Connect) GetAll(keyword string) (*[]ConnectItem, error) {
	keywordSQL := ""
	if keyword != "" {
		wheres := []string{
			fmt.Sprintf("host like '%%%s%%'", keyword),
			fmt.Sprintf("username like '%%%s%%'", keyword),
			fmt.Sprintf("label like '%%%s%%'", keyword),
		}

		keywordSQL = fmt.Sprintf("where %s", strings.Join(wheres, " or "))
	}

	rows, err := database.Get().Query(fmt.Sprintf(`select * from connect %s order by last_use_timestamp = 0 desc, last_use_timestamp desc`, keywordSQL))
	if err != nil {
		return nil, err
	}

	var items []ConnectItem
	for rows.Next() {
		p := ConnectItem{}
		err := rows.Scan(&p.ID, &p.Type, &p.Label, &p.UserName, &p.Password, &p.Port, &p.Host, &p.PrivateKey, &p.TagsString, &p.ProxyServerID, &p.Params, &p.AuthType, &p.LastUseTime, &p.CreateTime)
		if err != nil {
			continue
		}
		_ = json.Unmarshal([]byte(p.TagsString), &p.Tags)
		items = append(items, p)
	}

	return &items, nil
}

func (c Connect) ExportAll(ctx context.Context) {
	dir, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{
		DefaultDirectory:     filepath.Join(os.Getenv("HOME"), "/Downloads"),
		Title:                "选择导出目录",
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
		ResolvesAliases:      true,
	})
	if dir = strings.TrimSpace(dir); dir == "" || err != nil {
		utils.WarnMessage(ctx, "所选目录无效")
		return
	}
	filename := filepath.Join(dir, "acorn.yaml")

	if utils.UnsafeFileExists(filename) {
		if !utils.ConfirmMessage(ctx, fmt.Sprintf("文件 %s 已存在，是否覆盖", filename)) {
			utils.Message(ctx, "导出已取消")
			return
		}
	}

	connects, err := c.GetAll("")
	if err != nil {
		utils.WarnMessage(ctx, fmt.Sprintf("导出失败:%s", err.Error()))
		return
	}

	byaml, err := yaml.Marshal(connects)
	if err != nil {
		utils.WarnMessage(ctx, fmt.Sprintf("构建yaml失败:%s", err.Error()))
		return
	}

	if err = os.WriteFile(filename, byaml, 0777); err != nil {
		utils.WarnMessage(ctx, fmt.Sprintf("保存失败:%s", err.Error()))
		return
	}

	utils.Message(ctx, fmt.Sprintf("导出完成：%s", filename))
}
