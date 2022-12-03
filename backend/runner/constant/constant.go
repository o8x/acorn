package constant

type FileTransferParams struct {
	Src       string `json:"src"`
	Dst       string `json:"dst"`
	Overwrite bool   `json:"overwrite"`
}

type ShellParams struct {
	Environments map[string]string `json:"environments"`
	WorkDir      string            `json:"workdir"`
	Commands     []string          `json:"commands"`
}

type RemoteDeleteParams struct {
	Path       string `json:"path"`
	Recursion  bool   `json:"recursion"`
	Force      bool   `json:"force"`
	CheckExist bool   `json:"check_exist"`
}

type PluginTypes interface {
	RemoteDeleteParams | FileTransferParams | ShellParams
}
