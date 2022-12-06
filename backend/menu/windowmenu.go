package menu

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	top = false
)

func NewWindowMenu(ctx context.Context) *menu.MenuItem {
	w := New("Window")

	text := w.AddText("")
	update := func() {
		text.Label = fmt.Sprintf("Always Top: %v", top)
		runtime.MenuUpdateApplicationMenu(ctx)
	}

	w.AddSeparator()
	w.Add("Reload", func(data *menu.CallbackData) {
		runtime.WindowReload(ctx)
	})

	w.Add("Reload App", func(data *menu.CallbackData) {
		runtime.WindowReloadApp(ctx)
	})

	w.AddSeparator()
	w.Add("Default", func(data *menu.CallbackData) {
		runtime.WindowSetSize(ctx, 1024, 650)
	})

	w.Add("Maximise", func(data *menu.CallbackData) {
		runtime.WindowToggleMaximise(ctx)
	})

	w.Add("Minimise", func(data *menu.CallbackData) {
		runtime.WindowMinimise(ctx)
	})

	w.AddSeparator()
	w.Add("Always Top", func(data *menu.CallbackData) {
		top = !top
		runtime.WindowSetAlwaysOnTop(ctx, top)
		update()
	})

	w.Add("Move Center", func(data *menu.CallbackData) {
		runtime.WindowCenter(ctx)
	})

	update()
	return w.Build()
}
