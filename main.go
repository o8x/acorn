package main

import (
	"context"
	"embed"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	app "github.com/o8x/acorn/backend"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	server := app.New()

	defaultMenu := menu.NewMenu()
	defaultMenu.Append(menu.AppMenu())
	defaultMenu.Append(menu.EditMenu())

	err := wails.Run(&options.App{
		Title:         "",
		Width:         1024,
		Height:        650,
		Assets:        assets,
		DisableResize: false,
		Frameless:     false,
		Menu:          defaultMenu,
		OnStartup: func(ctx context.Context) {
			server.OnStartup(ctx, defaultMenu)
		},
		Bind: []interface{}{
			server.AppleScriptService,
			server.ConnectSessionService,
			server.FileSystemService,
			server.StatsService,
			server.TaskService,
			server.ToolService,
			server.AutomationService,
			server.SettingService,
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
