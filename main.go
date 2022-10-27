package main

import (
	"context"
	"embed"
	"github.com/o8x/acorn/backend"
	"github.com/o8x/acorn/backend/controller"
	"github.com/o8x/acorn/backend/service"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	conn := backend.NewConnect()
	app := backend.NewApp()
	transfer := controller.NewTransfer()
	tools := service.NewTools()
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
			app.OnStartup(ctx, defaultMenu)
			app.RegisterRouter(ctx)
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
