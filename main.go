package main

import (
	"context"
	"embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend"
	"github.com/o8x/acorn/backend/controller"
	"github.com/o8x/acorn/backend/database"
	"github.com/o8x/acorn/backend/utils"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

var (
	DefaultFileName = filepath.Join(os.Getenv("HOME"), ".config", "acorn", "acorn.sqlite")
)

func main() {
	conn := backend.NewConnect()
	app := backend.NewApp()
	transfer := controller.NewTransfer()
	tools := controller.NewTools()

	err := wails.Run(&options.App{
		Title:         "",
		Width:         1024,
		Height:        650,
		Assets:        assets,
		DisableResize: false,
		Frameless:     false,
		OnStartup: func(ctx context.Context) {
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

			app.Startup(ctx)
		},
		Bind: []interface{}{
			conn,
			transfer,
			tools,
		},
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
			},
			Appearance: mac.NSAppearanceNameVibrantLight,
			About: &mac.AboutInfo{
				Title:   "Acorn",
				Message: "© 2022 Alex(stdout.com.cn)",
				Icon:    icon,
			},
		},
	})
	if err != nil {
		panic(err)
	}
}
