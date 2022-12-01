package constant

type FileTransferParams struct {
	Src       string `json:"src"`
	Dst       string `json:"dst"`
	Overwrite bool   `json:"overwrite"`
}

type ShellParams struct {
	Command string `json:"command"`
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
