package menu

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func NewToysMenu(ctx context.Context) *menu.MenuItem {
	f := New("Toys")
	f.Add("Clock", func(data *menu.CallbackData) {
		runtime.EventsEmit(ctx, "navigator", "/toy-clock")
	})

	f.Add("Tencent COS", func(data *menu.CallbackData) {
		runtime.EventsEmit(ctx, "navigator", "/toy-cos")
	})

	f.Add("Script", func(data *menu.CallbackData) {
		runtime.EventsEmit(ctx, "navigator", "/toy-scripteditor")
	})

	f.Add("Password", func(data *menu.CallbackData) {
		runtime.EventsEmit(ctx, "navigator", "/toy-makepass")
	})

	f.Add("Ascii", func(data *menu.CallbackData) {
		runtime.EventsEmit(ctx, "navigator", "/toy-ascii/visible")
	})

	return f.Build()
}
