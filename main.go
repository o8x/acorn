package main

import (
	"embed"
	"os"
	"path/filepath"

	"github.com/o8x/acorn/backend"
	"github.com/o8x/acorn/backend/database"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

var (
	DefaultFileName = filepath.Join(filepath.Dir(os.Args[0]), "../", "Resources", "acorn.sqlite")
)

func main() {
	conn := backend.NewConnect()
	app := backend.NewApp()

	if err := database.Init(DefaultFileName); err != nil {
		panic(err)
	}

	err := wails.Run(&options.App{
		Title:         "",
		Width:         1024,
		Height:        650,
		Assets:        assets,
		DisableResize: false,
		Frameless:     false,
		OnStartup:     app.Startup,
		Bind: []interface{}{
			conn,
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
