package controller

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/utils"
	"github.com/o8x/acorn/backend/utils/aes"
)

const (
	AESKey = "Fgd8AcvsEUurSoKeIklNOib74x5wDmCX"
)

type Tools struct {
	ctx context.Context
}

func NewTools() *Tools {
	return &Tools{}
}

func (t Tools) Base64Encode(text string) *response.Response {
	return response.OK(base64.StdEncoding.EncodeToString([]byte(text)))
}

func (t Tools) Base64Decode(text string) *response.Response {
	str, err := base64.StdEncoding.DecodeString(text)
	if err != nil {
		return response.Error(err)
	}
	return response.OK(string(str))
}

func (t Tools) Base58Encode(text string) *response.Response {
	return response.OK(utils.Base58Encoding(text))
}

func (t Tools) Base58Decode(text string) *response.Response {
	return response.OK(utils.Base58Decoding(text))
}

func (t Tools) Sha1(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", sha1.Sum([]byte(text))))
}

func (t Tools) Sha2(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", sha256.Sum256([]byte(text))))
}

func (t Tools) Sha224(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", sha256.Sum224([]byte(text))))
}

func (t Tools) MD5(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", md5.Sum([]byte(text))))
}

func (t Tools) Hex(text string) *response.Response {
	return response.OK(hex.EncodeToString([]byte(text)))
}

func (t Tools) HexDecode(text string) *response.Response {
	res, err := hex.DecodeString(text)
	if err != nil {
		return response.Error(err)
	}
	return response.OK(string(res))
}

func (t Tools) Gzip(text string) *response.Response {
	buf := &bytes.Buffer{}
	g := gzip.NewWriter(buf)
	defer g.Close()

	if _, err := g.Write([]byte(text)); err != nil {
		return response.Error(err)
	}

	return response.OK(base64.StdEncoding.EncodeToString(buf.Bytes()))
}

func (t Tools) GzipDecode(text string) *response.Response {
	b, err := base64.StdEncoding.DecodeString(text)
	if err != nil {
		return response.Error(err)
	}

	g, err := gzip.NewReader(bytes.NewReader(b))
	if err != nil {
		return response.Error(err)
	}
	defer g.Close()

	all, err := io.ReadAll(g)
	if err != nil {
		return response.Error(err)
	}

	return response.OK(string(all))
}

func (t Tools) Aes(text string) *response.Response {
	encrypt, err := aes.ECBEncrypt([]byte(text), []byte("Fgd8AcvsEUurSoKeIklNOib74x5wDmCX"))
	if err != nil {
		return response.Error(err)
	}

	return response.OK(map[string]interface{}{
		"key":       AESKey,
		"encrypted": base64.StdEncoding.EncodeToString(encrypt),
	})
}

func (t Tools) AesDecode(text string) *response.Response {
	b, err := base64.StdEncoding.DecodeString(text)
	if err != nil {
		return response.Error(err)
	}

	encrypt, err := aes.ECBDecrypt(b, []byte("Fgd8AcvsEUurSoKeIklNOib74x5wDmCX"))
	if err != nil {
		return response.Error(err)
	}

	return response.OK(base64.StdEncoding.EncodeToString(encrypt))
}
