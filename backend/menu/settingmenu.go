package menu

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"

	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/utils"
)

func NewSettingMenu(ctx context.Context) *menu.MenuItem {
	f := New("Settings")
	f.Add("Export", func(data *menu.CallbackData) {
		ExportAll(ctx)
	})

	return f.Build()
}

func ExportAll(ctx context.Context) {
	dir, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{
		DefaultDirectory:     filepath.Join(os.Getenv("HOME"), "/Downloads"),
		Title:                "选择导出目录",
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
		ResolvesAliases:      true,
	})
	if dir = strings.TrimSpace(dir); dir == "" || err != nil {
		utils.WarnMessage(ctx, "所选目录无效")
		return
	}
	filename := filepath.Join(dir, "acorn.yaml")

	if utils.UnsafeFileExists(filename) {
		if !utils.ConfirmMessage(ctx, fmt.Sprintf("文件 %s 已存在，是否覆盖", filename)) {
			utils.Message(ctx, "导出已取消")
			return
		}
	}

	byaml, err := yaml.Marshal(model.GetSessions())
	if err != nil {
		utils.WarnMessage(ctx, fmt.Sprintf("构建yaml失败:%s", err.Error()))
		return
	}

	if err = os.WriteFile(filename, byaml, 0777); err != nil {
		utils.WarnMessage(ctx, fmt.Sprintf("保存失败:%s", err.Error()))
		return
	}

	utils.Message(ctx, fmt.Sprintf("导出完成：%s", filename))
}
