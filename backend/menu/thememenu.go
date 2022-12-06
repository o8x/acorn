package menu

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/service"
)

func NewThemeMenu(ctx context.Context, s *service.SettingService) *menu.MenuItem {
	t := New("Theme")
	text := t.AddText(fmt.Sprintf("Theme: %s", model.GetTheme()))

	update := func() {
		text.Label = fmt.Sprintf("Theme: %s", model.GetTheme())
		runtime.MenuUpdateApplicationMenu(ctx)
		runtime.EventsEmit(ctx, "update-theme")
	}

	t.AddSeparator()
	t.Add("Default Theme", func(data *menu.CallbackData) {
		update()
		s.UseDefaultTheme()
	})

	t.Add("Light Theme", func(data *menu.CallbackData) {
		update()
		s.UseLightTheme()
	})

	t.Add("Dark Theme", func(data *menu.CallbackData) {
		update()
		s.UseDarkTheme()
	})

	t.Add("Gary Theme", func(data *menu.CallbackData) {
		update()
		s.UseGrayTheme()
	})

	return t.Build()
}
