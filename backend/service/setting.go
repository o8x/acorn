package service

import (
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend/response"
)

type SettingService struct {
	*Service
}

func (t *SettingService) GetTheme() *response.Response {
	theme, err := t.DB.GetTheme(t.Context)
	if err != nil {
		return response.Error(err)
	}
	return response.OK(theme)
}

func (t *SettingService) UseLightTheme() *response.Response {
	if err := t.DB.UseLightTheme(t.Context); err != nil {
		return response.Error(err)
	}

	runtime.WindowSetLightTheme(t.Context)
	return response.NoContent()
}

func (t *SettingService) UseDarkTheme() *response.Response {
	if err := t.DB.UseDarkTheme(t.Context); err != nil {
		return response.Error(err)
	}

	runtime.WindowSetDarkTheme(t.Context)
	return response.NoContent()
}

func (t *SettingService) UseGrayTheme() *response.Response {
	if err := t.DB.UseGrayTheme(t.Context); err != nil {
		return response.Error(err)
	}

	runtime.WindowSetDarkTheme(t.Context)
	return response.NoContent()
}
