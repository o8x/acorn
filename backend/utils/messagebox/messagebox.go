package messagebox

import (
	"context"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func SelectDirectory(ctx context.Context, defaultDir string) string {
	dir, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{
		DefaultDirectory:     defaultDir,
		Title:                "选择下载目录",
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
		ResolvesAliases:      true,
	})

	if dir = strings.TrimSpace(dir); dir == "" || err != nil {
		return ""
	}

	return dir
}

func SelectFiles(ctx context.Context) []string {
	sFiles, err := runtime.OpenMultipleFilesDialog(ctx, runtime.OpenDialogOptions{
		Title:                      "选择文件",
		ShowHiddenFiles:            true,
		CanCreateDirectories:       true,
		ResolvesAliases:            true,
		TreatPackagesAsDirectories: true,
	})

	if err != nil || len(sFiles) == 0 {
		return nil
	}

	return sFiles
}
