package controller

import (
	"context"
	"path/filepath"
)

type Transfer struct {
	ctx context.Context
}

func NewTransfer() *Transfer {
	return &Transfer{}
}

func (t *Transfer) CleanPath(path string) string {
	return filepath.Clean(path)
}
