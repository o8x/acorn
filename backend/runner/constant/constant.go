package constant

type FileTransferParams struct {
	Src         string `json:"src"`
	Dst         string `json:"dst"`
	Overwrite   string `json:"overwrite"`
	AutoMakeDir bool   `json:"auto_mkdir"`
}

func (p FileTransferParams) OverwriteIsSkip() bool {
	return p.Overwrite == "skip"
}

func (p FileTransferParams) OverwriteIsStop() bool {
	return p.Overwrite == "stop"
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

type RemoteCopyParams struct {
	Source string `json:"source"`
	Target string `json:"target"`
	IsDir  bool   `json:"is_dir"`
}

type RemoteMoveParams struct {
	Source string `json:"source"`
	Target string `json:"target"`
}
