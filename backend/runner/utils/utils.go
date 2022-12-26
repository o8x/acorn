package utils

import (
	"bytes"
	"os"
	"regexp"
)

var envReg = regexp.MustCompile(`\$\w+`)

func FillEnv[T string | []byte](str T) T {
	result := envReg.ReplaceAllFunc([]byte(str), func(it []byte) []byte {
		if env := os.Getenv(string(bytes.TrimLeft(it, "$"))); env != "" {
			return []byte(env)
		}
		return it
	})
	return T(result)
}
