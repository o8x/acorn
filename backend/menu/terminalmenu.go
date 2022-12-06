package menu

import (
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"

	"github.com/o8x/acorn/backend/service"
)

func NewTerminalMenu(s *service.SessionService) *menu.MenuItem {
	t := New("Terminal")
	t.Add("New Local Terminal", func(data *menu.CallbackData) {
		s.OpenLocalConsole()
	})
	t.BindKey("New Local Terminal", keys.CmdOrCtrl("t"))

	return t.Build()
}
