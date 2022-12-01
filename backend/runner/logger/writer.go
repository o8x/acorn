package logger

type WriteFunc func(string) error

type Writer struct {
	WriteFunc WriteFunc
}

func (l Writer) Write(p []byte) (n int, err error) {
	if l.WriteFunc != nil {
		return len(p), l.WriteFunc(string(p))
	}

	return 0, nil
}
