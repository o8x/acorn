package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/o8x/acorn/backend/database"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/ssh"
	"github.com/o8x/acorn/backend/utils"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx     context.Context
	connect *Connect
}

func NewApp() *App {
	return &App{
		connect: NewConnect(),
	}
}

var (
	DefaultFileName = filepath.Join(os.Getenv("HOME"), ".config", "acorn", "acorn.sqlite")
)

func (c *App) OnStartup(ctx context.Context, defaultMenu *menu.Menu) {
	if !utils.UnsafeFileExists(DefaultFileName) {
		if err := database.AutoCreateDB(DefaultFileName); err != nil {
			_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "启动错误",
				Message: fmt.Sprintf(`数据库%s初始化失败:  %s`, DefaultFileName, err.Error()),
			})
			runtime.Quit(ctx)
		}
	}

	if err := database.Init(DefaultFileName); err != nil {
		_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "启动错误",
			Message: fmt.Sprintf(`数据库%s连接失败:  %s`, DefaultFileName, err.Error()),
		})
		runtime.Quit(ctx)
	}

	FileMenu := defaultMenu.AddSubmenu("Setting Manage")
	FileMenu.AddText("Export Connects To Yaml", keys.CmdOrCtrl("o"), func(data *menu.CallbackData) {
		c.connect.ExportAll(ctx)
	})
	FileMenu.AddText("Import Connects From Yaml", keys.CmdOrCtrl("i"), func(data *menu.CallbackData) {
		utils.Message(ctx, "尚未实现")
	})

	FileMenu.AddSeparator()

	runtime.MenuSetApplicationMenu(ctx, defaultMenu)
	runtime.MenuUpdateApplicationMenu(ctx)
}

func (c *App) RegisterRouter(ctx context.Context) {
	c.ctx = ctx

	runtime.EventsOn(ctx, "delete_connect", func(data ...interface{}) {
		for _, id := range data[0].([]interface{}) {
			stmt, err := database.Get().Prepare(`delete from connect where id = ?`)
			if err != nil {
				runtime.EventsEmit(ctx, "delete_connect_reply", response.Error(err))
				return
			}

			res, err := stmt.Exec(id)
			if err != nil {
				runtime.EventsEmit(ctx, "delete_connect_reply", response.Error(err))
				return
			}

			affect, err := res.RowsAffected()
			if err != nil {
				runtime.EventsEmit(ctx, "delete_connect_reply", response.Error(err))
				return
			}

			if affect > 0 {
				runtime.EventsEmit(ctx, "delete_connect_reply", response.NoContent())
				return
			}

			runtime.EventsEmit(ctx, "delete_connect_reply", response.Warn("删除失败"))
		}
	})

	runtime.EventsOn(ctx, "add_connect", func(data ...interface{}) {
		item := data[0].(map[string]interface{})

		stmt, err := database.Get().Prepare(`insert into connect (type, label, username, port, host, params, auth_type) values (?, ?, ?, ?, ?, ?, ?)`)
		if err != nil {
			runtime.EventsEmit(ctx, "add_connect_reply", response.Error(err))
			return
		}

		if _, err := stmt.Exec(item["type"], item["label"], item["username"], item["port"], item["host"], item["params"], item["auth_type"]); err != nil {
			runtime.EventsEmit(ctx, "add_connect_reply", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "add_connect_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "ping_connect", func(data ...interface{}) {
		for _, id := range data[0].([]interface{}) {
			id, ok := id.(float64)
			if !ok {
				continue
			}
			c.connect.PingConnect(int(id))
		}

		runtime.EventsEmit(ctx, "ping_connect_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "open_ssh_session", func(data ...interface{}) {
		for _, id := range data[0].([]interface{}) {
			id, ok := id.(float64)
			if !ok {
				continue
			}
			c.connect.SSHConnect(int(id), data[1].(string))
		}

		runtime.EventsEmit(ctx, "open_ssh_session_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "open_local_console", func(data ...interface{}) {
		runtime.EventsEmit(ctx, "open_local_console_reply", c.connect.OpenLocalConsole())
	})

	runtime.EventsOn(ctx, "edit_connect", func(data ...interface{}) {
		marshal, err := json.Marshal(data[0])
		if err != nil {
			runtime.EventsEmit(ctx, "edit_connect_reply", response.Error(err))
			return
		}

		var it ConnectItem
		if err := json.Unmarshal(marshal, &it); err != nil {
			runtime.EventsEmit(ctx, "edit_connect_reply", response.Error(err))
			return
		}

		if it.Type == "linux" {
			getOsRelease := func(it ConnectItem) *ssh.OsRelease {
				conn := ssh.New(ssh.Connection{
					Host:       it.Host,
					User:       it.UserName,
					Port:       it.Port,
					Password:   it.Password,
					AuthMethod: it.AuthType,
				})

				if err := conn.Connect(); err != nil {
					return nil
				}

				if err := conn.OpenSession(true); err != nil {
					return nil
				}

				if info, err := ssh.ProberOSInfo(conn); err == nil {
					return info
				}

				return nil
			}

			if r := getOsRelease(it); r != nil {
				it.Type = r.ID
				if it.Label == "" {
					it.Label = r.PrettyName
				}
			}
		}

		if it.Label == "no label" {
			it.Label = ""
		}

		if err = c.connect.EditConnect(it); err != nil {
			runtime.EventsEmit(ctx, "edit_connect_reply", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "edit_connect_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "get_connects", func(data ...interface{}) {
		keyword := ""
		if len(data) > 0 && data[0] != nil {
			keyword = data[0].(string)
		}

		items, err := c.connect.GetAll(keyword)
		if err != nil {
			runtime.EventsEmit(ctx, "set_connects", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "set_connects", response.OK(items))
	})

	runtime.EventsOn(ctx, "list_dir", func(data ...interface{}) {
		var c ConnectItem
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)
		if err := GetInfoByID(int(id), &c); err != nil {
			runtime.EventsEmit(ctx, "list_dir_reply", response.Error(err))
			return
		}

		conn := ssh.New(ssh.Connection{
			Host:       c.Host,
			User:       c.UserName,
			Port:       c.Port,
			Password:   c.Password,
			AuthMethod: c.AuthType,
		})

		if err := conn.Connect(); err != nil {
			runtime.EventsEmit(ctx, "list_dir_reply", response.Error(err))
			return
		}

		if err := conn.OpenSession(true); err != nil {
			runtime.EventsEmit(ctx, "list_dir_reply", response.Error(err))
			return
		}

		list, err := ssh.ListRemoteDir(conn, data[1].(string))
		if err != nil {
			runtime.EventsEmit(ctx, "list_dir_reply", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "list_dir_reply", response.OK(list))
	})

	runtime.EventsOn(ctx, "download_files", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		runtime.EventsEmit(ctx, "download_files_reply",
			c.connect.SCPDownload(ctx, int(id), data[1].(string)),
		)
	})

	runtime.EventsOn(ctx, "upload_files", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		runtime.EventsEmit(ctx, "upload_files_reply",
			c.connect.SCPUpload(ctx, int(id), data[1].(string)),
		)
	})

	runtime.EventsOn(ctx, "drag_upload_files", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)
		b64 := strings.Split(data[3].(string), "base64,")
		if len(b64) > 1 {
			runtime.EventsEmit(ctx, "drag_upload_files_reply",
				c.connect.SCPUploadBase64(int(id), data[1].(string), data[2].(string), b64[1]),
			)
			return
		}
		runtime.EventsEmit(ctx, "drag_upload_files_reply", response.Warn("无效文件流"))
	})

	runtime.EventsOn(ctx, "cloud_download", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		runtime.EventsEmit(ctx, "cloud_download_replay",
			c.connect.CloudDownload(int(id), data[1].(string), data[2].(string)),
		)
	})

	runtime.EventsOn(ctx, "import_rdp_file", func(data ...interface{}) {
		runtime.EventsEmit(ctx, "import_rdp_file_replay", c.connect.importRDPFile(ctx))
	})
}
