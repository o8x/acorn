package service

import (
	"bytes"
	"compress/gzip"
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/o8x/acorn/backend/response"
	"github.com/o8x/acorn/backend/scripts"
	"github.com/o8x/acorn/backend/utils"
	"github.com/o8x/acorn/backend/utils/aes"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

const (
	AESKey = "Fgd8AcvsEUurSoKeIklNOib74x5wDmCX"
)

type ToolService struct {
	*Service
}

func (t ToolService) Base64Encode(text string) *response.Response {
	return response.OK(base64.StdEncoding.EncodeToString([]byte(text)))
}

func (t ToolService) Base64Decode(text string) *response.Response {
	str, err := base64.StdEncoding.DecodeString(text)
	if err != nil {
		return response.Error(err)
	}
	return response.OK(string(str))
}

func (t ToolService) Base58Encode(text string) *response.Response {
	return response.OK(utils.Base58Encoding(text))
}

func (t ToolService) Base58Decode(text string) *response.Response {
	return response.OK(utils.Base58Decoding(text))
}

func (t ToolService) Sha1(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", sha1.Sum([]byte(text))))
}

func (t ToolService) Sha2(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", sha256.Sum256([]byte(text))))
}

func (t ToolService) Sha224(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", sha256.Sum224([]byte(text))))
}

func (t ToolService) MD5(text string) *response.Response {
	return response.OK(fmt.Sprintf("%x", md5.Sum([]byte(text))))
}

func (t ToolService) Hex(text string) *response.Response {
	return response.OK(hex.EncodeToString([]byte(text)))
}

func (t ToolService) HexDecode(text string) *response.Response {
	res, err := hex.DecodeString(text)
	if err != nil {
		return response.Error(err)
	}
	return response.OK(string(res))
}

func (t ToolService) Gzip(text string) *response.Response {
	buf := &bytes.Buffer{}
	g := gzip.NewWriter(buf)
	defer g.Close()

	if _, err := g.Write([]byte(text)); err != nil {
		return response.Error(err)
	}

	return response.OK(base64.StdEncoding.EncodeToString(buf.Bytes()))
}

func (t ToolService) GzipDecode(text string) *response.Response {
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

func (t ToolService) Aes(text string) *response.Response {
	encrypt, err := aes.ECBEncrypt([]byte(text), []byte("Fgd8AcvsEUurSoKeIklNOib74x5wDmCX"))
	if err != nil {
		return response.Error(err)
	}

	return response.OK(map[string]interface{}{
		"key":       AESKey,
		"encrypted": base64.StdEncoding.EncodeToString(encrypt),
	})
}

func (t ToolService) AesDecode(text string) *response.Response {
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

func (t ToolService) RunTestWithCurl(data any) *response.Response {
	script, err := scripts.Create(t.GenCurlCommand(data))
	if err != nil {
		return response.Error(err)
	}

	if err = scripts.Exec(script); err != nil {
		return response.Error(err)
	}

	return response.NoContent()
}

func (t ToolService) GenCurlCommand(data any) string {
	args := data.(map[string]any)
	params := args["args"].([]interface{})
	method := args["method"].(string)
	rawData := args["data"].(string)
	target := args["target"].(string)
	proxyProto := args["proxyProto"].(string)
	proxyUsername := args["proxyUsername"].(string)
	proxyPassword := args["proxyPassword"].(string)
	proxyServer := args["proxyServer"].(string)

	builder := strings.Builder{}
	builder.WriteString("curl ")
	if method = strings.ToUpper(method); method != http.MethodGet {
		if method == http.MethodHead {
			builder.WriteString("-I ")
		} else {
			builder.WriteString(fmt.Sprintf("-X %s ", method))
		}
	}

	for _, it := range params {
		switch it.(string) {
		case "verbose":
			builder.WriteString("-v")
		case "time":
			script := `\n
ns_lookup:      %{time_namelookup}s\n
connect:        %{time_connect}s\n
connect:        %{time_appconnect}s\n
pre transfer:   %{time_pretransfer}s\n
redirect:       %{time_redirect}s\n
start transfer: %{time_starttransfer}s\n\n
speed:          %{speed_download}byte/s\n
http code:      %{http_code}\n
total time:     %{time_total}s\n`

			file := "/tmp/curl.stats"
			_ = os.WriteFile(file, []byte(script), 0777)

			builder.WriteString(fmt.Sprintf("-w @%s", file))
		case "location":
			builder.WriteString("-L")
		case "tls":
			builder.WriteString("-k")
		case "simple":
			builder.WriteString("-s")
		case "download":
			builder.WriteString("-o /dev/null")
		case "trace":
			file := filepath.Join("/tmp", fmt.Sprintf("trace%d.text", rand.Intn(1000)))
			builder.WriteString(fmt.Sprintf("--trace %s", file))
		}
		builder.WriteString(" ")
	}

	if proxyServer != "" {
		u := url.URL{
			Scheme: proxyProto,
			User:   url.UserPassword(proxyUsername, proxyPassword),
			Host:   proxyServer,
		}

		unescape, _ := url.QueryUnescape(u.String())
		builder.WriteString(fmt.Sprintf("-x %s ", unescape))
	}

	builder.WriteString(fmt.Sprintf(`"%s"`, target))
	cmd := builder.String()

	builder.Reset()
	builder.WriteString(strings.ReplaceAll(cmd, "  ", " "))

	if rawData != "" {
		builder.WriteString(fmt.Sprintf(" --data '%s'", rawData))
	}

	return builder.String()
}
