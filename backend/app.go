package app

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend/database"
	"github.com/o8x/acorn/backend/database/queries"
	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/service"
	"github.com/o8x/acorn/backend/service/tasker"
	"github.com/o8x/acorn/backend/ssh"
	"github.com/o8x/acorn/backend/utils"
)

var (
	baseService = &service.Service{}
)

type App struct {
	// remove
	Connect *Connect

	Context               context.Context
	AppleScriptService    *service.AppleScriptService
	ConnectSessionService *service.SessionService
	FileSystemService     *service.FileSystemService
	StatsService          *service.StatsService
	TaskService           *service.TaskService
	ToolService           *service.ToolService
	TagService            *service.TagService
	AutomationService     *service.AutomationService
}

func New() *App {
	return &App{
		Connect:               NewConnect(),
		AppleScriptService:    &service.AppleScriptService{Service: baseService},
		ConnectSessionService: &service.SessionService{Service: baseService},
		FileSystemService:     &service.FileSystemService{Service: baseService},
		StatsService:          &service.StatsService{Service: baseService},
		TaskService:           &service.TaskService{Service: baseService},
		AutomationService:     &service.AutomationService{Service: baseService},
		ToolService:           &service.ToolService{Service: baseService},
		TagService:            &service.TagService{Service: baseService},
	}
}

var (
	DefaultFileName = filepath.Join(os.Getenv("HOME"), ".config", "acorn", "acorn.sqlite")
)

func (c *App) OnStartup(ctx context.Context, currentMenus *menu.Menu) {
	c.Context = ctx

	c.initDatabase()
	c.initBaseService()
	c.registerMenus(currentMenus)
	c.registerRouter(ctx)
}

func (c *App) initDatabase() {
	if !utils.UnsafeFileExists(DefaultFileName) {
		if err := database.AutoCreateDB(DefaultFileName); err != nil {
			_, _ = runtime.MessageDialog(c.Context, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "启动错误",
				Message: fmt.Sprintf(`数据库%s初始化失败:  %s`, DefaultFileName, err.Error()),
			})
			runtime.Quit(c.Context)
		}
	}

	if err := database.Init(DefaultFileName); err != nil {
		_, _ = runtime.MessageDialog(c.Context, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "启动错误",
			Message: fmt.Sprintf(`数据库%s连接失败:  %s`, DefaultFileName, err.Error()),
		})
		runtime.Quit(c.Context)
	}
}

func (c *App) initBaseService() {
	baseService.DB = database.GetQueries()
	baseService.Context = c.Context
	baseService.Message = &service.Message{Context: c.Context}
	baseService.Tasker = &tasker.Tasker{
		Context: c.Context,
		DB:      database.GetQueries(),
	}
}
func (c *App) registerMenus(current *menu.Menu) {
	terminalMenu := current.AddSubmenu("Terminal")
	terminalMenu.AddText("New Terminal Window", keys.CmdOrCtrl("t"), func(data *menu.CallbackData) {
		c.ConnectSessionService.OpenLocalConsole()
	})

	fileMenu := current.AddSubmenu("Settings")
	fileMenu.AddText("Export", keys.CmdOrCtrl("w"), func(data *menu.CallbackData) {
		c.Connect.ExportAll(c.Context)
	})
	fileMenu.AddText("Import", keys.CmdOrCtrl("i"), func(data *menu.CallbackData) {
		utils.Message(c.Context, "尚未实现")
	})

	fileMenu.AddSeparator()

	runtime.MenuSetApplicationMenu(c.Context, current)
	runtime.MenuUpdateApplicationMenu(c.Context)
}

func (c *App) registerRouter(ctx context.Context) {
	c.Context = ctx

	runtime.EventsOn(ctx, "add_recent", func(data ...interface{}) {
		item := data[0].(map[string]interface{})

		stmt, err := database.Get().Prepare(`INSERT INTO recent (type, label, url, logo_url) VALUES (?, ?, ? ,?)`)
		if err != nil {
			runtime.EventsEmit(ctx, "add_recent_reply", response.Error(err))
			return
		}

		if _, err := stmt.Exec(item["type"], item["label"], item["url"], item["logo_url"]); err != nil {
			runtime.EventsEmit(ctx, "add_recent_reply", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "add_recent_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "get_recent", func(data ...interface{}) {
		rows, err := database.Get().Query("select * from recent")
		if err != nil {
			runtime.EventsEmit(ctx, "get_recent_reply", response.OK(nil))
			return
		}

		type Recent struct {
			Type       string    `json:"type"`
			Label      string    `json:"label"`
			Url        string    `json:"url"`
			LogoUrl    string    `json:"logo_url"`
			ID         int       `json:"id"`
			IsDelete   int       `json:"is_delete"`
			CreateTime time.Time `json:"create_time"`
		}

		var items []Recent
		for rows.Next() {
			p := Recent{}
			err := rows.Scan(&p.ID, &p.Type, &p.Label, &p.Url, &p.LogoUrl, &p.IsDelete, &p.CreateTime)
			if err != nil {
				continue
			}
			items = append(items, p)
		}

		runtime.EventsEmit(ctx, "get_recent_reply", response.OK(items))
	})

	runtime.EventsOn(ctx, "gen_script", func(data ...interface{}) {
		var c ConnectItem

		// 默认生成到 stdout.com.cn
		if err := GetInfoByID(1, &c); err != nil {
			runtime.EventsEmit(ctx, "gen_script_reply", response.Error(err))
			return
		}

		conn := ssh.Start(ssh.SSH{
			Config: queries.Connect{
				Host:     c.Host,
				Username: c.UserName,
				Port:     int64(c.Port),
				Password: c.Password,
				AuthType: c.AuthType,
			},
		})

		if err := conn.Connect(); err != nil {
			runtime.EventsEmit(ctx, "gen_script_reply", response.Error(err))
			return
		}

		filename := fmt.Sprintf("/srv/files/@%s.sh", data[0].(string))
		if err := ssh.WriteFile(conn, filename, data[1].(string)); err != nil {
			runtime.EventsEmit(ctx, "gen_script_reply", response.Error(err))
			return
		}

		if _, err := conn.ExecShellCode("/srv/files/genhelp.sh"); err != nil {
			runtime.EventsEmit(ctx, "gen_script_reply",
				response.Warn(fmt.Sprintf("update help fails %s", err.Error())),
			)
			return
		}

		runtime.EventsEmit(ctx, "gen_script_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "remove_files", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		var c ConnectItem
		if err := GetInfoByID(int(id), &c); err != nil {
			runtime.EventsEmit(ctx, "remove_files_reply", response.Error(err))
			return
		}

		if err := database.IntValueInc(DeleteFileStatsKey); err != nil {
			runtime.EventsEmit(ctx, "remove_files_reply", response.Error(err))
			return
		}

		conn := ssh.Start(ssh.SSH{
			Config: queries.Connect{
				Host:     c.Host,
				Username: c.UserName,
				Port:     int64(c.Port),
				Password: c.Password,
				AuthType: c.AuthType,
			},
		})

		if err := conn.Connect(); err != nil {
			runtime.EventsEmit(ctx, "remove_files_reply", response.Error(err))
			return
		}

		filename := data[1].(string)
		if _, err := conn.ExecShellCode(fmt.Sprintf("mv '%s' /tmp", filename)); err != nil {
			runtime.EventsEmit(ctx, "gen_script_reply",
				response.Warn(fmt.Sprintf("update help fails %s", err.Error())),
			)
			return
		}

		runtime.EventsEmit(ctx, "remove_files_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "edit_file", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		var c ConnectItem
		if err := GetInfoByID(int(id), &c); err != nil {
			runtime.EventsEmit(ctx, "edit_file_reply", response.Error(err))
			return
		}

		if err := database.IntValueInc(EditFileStatsKey); err != nil {
			runtime.EventsEmit(ctx, "edit_file_reply", response.Error(err))
			return
		}

		conn := ssh.Start(ssh.SSH{
			Config: queries.Connect{
				Host:     c.Host,
				Username: c.UserName,
				Port:     int64(c.Port),
				Password: c.Password,
				AuthType: c.AuthType,
			},
		})

		if err := conn.Connect(); err != nil {
			runtime.EventsEmit(ctx, "edit_file_reply", response.Error(err))
			return
		}

		client, err := sftp.NewClient(conn.GetClient())
		if err != nil {
			runtime.EventsEmit(ctx, "edit_file_reply", response.Error(err))
			return
		}
		defer client.Close()

		file, err := client.OpenFile(data[1].(string), os.O_RDONLY)
		if err != nil {
			runtime.EventsEmit(ctx, "edit_file_reply", response.Error(err))
			return
		}

		all, err := io.ReadAll(file)
		if err != nil {
			runtime.EventsEmit(ctx, "edit_file_reply", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "edit_file_reply", response.OK(string(all)))
	})

	runtime.EventsOn(ctx, "save_file", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		var c ConnectItem
		if err := GetInfoByID(int(id), &c); err != nil {
			runtime.EventsEmit(ctx, "save_file_reply", response.Error(err))
			return
		}

		conn := ssh.Start(ssh.SSH{
			Config: queries.Connect{
				Host:     c.Host,
				Username: c.UserName,
				Port:     int64(c.Port),
				Password: c.Password,
				AuthType: c.AuthType,
			},
		})

		if err := conn.Connect(); err != nil {
			runtime.EventsEmit(ctx, "save_file_reply", response.Error(err))
			return
		}

		filename := data[1].(string)
		command := fmt.Sprintf("cp '%s' '%s.backup'", filename, filename)
		if _, err := conn.ExecShellCode(command); err != nil {
			runtime.EventsEmit(ctx, "save_file_reply",
				response.Warn(fmt.Sprintf("文件备份失败: %s", filename)),
			)
			return
		}

		client, err := sftp.NewClient(conn.GetClient())
		if err != nil {
			runtime.EventsEmit(ctx, "save_file_reply", response.Error(err))
			return
		}
		defer client.Close()

		file, err := client.OpenFile(filename, os.O_WRONLY)
		if err != nil {
			runtime.EventsEmit(ctx, "save_file_reply", response.Error(err))
			return
		}
		defer file.Close()

		file.Seek(0, 0)
		file.Truncate(0)
		if _, err := file.Write([]byte(data[2].(string))); err != nil {
			runtime.EventsEmit(ctx, "save_file_reply", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "save_file_reply", response.NoContent())
	})

	runtime.EventsOn(ctx, "drag_upload_files", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)
		b64 := strings.Split(data[3].(string), "base64,")
		if len(b64) > 1 {
			runtime.EventsEmit(ctx, "drag_upload_files_reply",
				c.Connect.SCPUploadBase64(int(id), data[1].(string), data[2].(string), b64[1]),
			)
			return
		}
		runtime.EventsEmit(ctx, "drag_upload_files_reply", response.Warn("无效文件流"))
	})

	runtime.EventsOn(ctx, "cloud_download", func(data ...interface{}) {
		id, _ := strconv.ParseInt(data[0].(string), 10, 32)

		runtime.EventsEmit(ctx, "cloud_download_replay",
			c.Connect.CloudDownload(int(id), data[1].(string), data[2].(string)),
		)
	})

	runtime.EventsOn(ctx, "import_rdp_file", func(data ...interface{}) {
		runtime.EventsEmit(ctx, "import_rdp_file_replay", c.Connect.importRDPFile(ctx))
	})

	runtime.EventsOn(ctx, "get_tags", func(data ...interface{}) {
		all, err := c.TagService.GetAll()
		if err != nil {
			runtime.EventsEmit(ctx, "get_tags_replay", response.Error(err))
			return
		}

		runtime.EventsEmit(ctx, "get_tags_replay", response.OK(all))
	})

	runtime.EventsOn(ctx, "get_stats", func(data ...interface{}) {
		type stats struct {
			SumCount int `json:"sum_count"`
		}

		list := []string{
			ConnectSSHStatsKey,
			ConnectRDPStatsKey,
			PingStatsKey,
			TopStatsKey,
			ScpUploadStatsKey,
			ScpUploadBase64StatsKey,
			ScpDownStatsKey,
			ScpCloudDownStatsKey,
			LocalITermStatsKey,
			LoadRDPStatsKey,
			FileTransferStatsKey,
			CopyIDStatsKey,
			EditFileStatsKey,
			DeleteFileStatsKey,
		}

		r := stats{}
		for _, k := range list {
			val, _ := database.GetValueInt(k)
			r.SumCount += val
		}

		runtime.EventsEmit(ctx, "get_stats_reply", response.OK(r))
	})
}
