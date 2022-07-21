package utils

import (
	"bytes"
	"context"
	"fmt"
	"math/big"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func WriteTempFile(content string) (*os.File, error) {
	f, err := os.CreateTemp("", "*")
	if err != nil {
		return nil, err
	}

	_, _ = f.WriteString(content)
	return f, nil
}

func WriteTempFileAutoClose(content string) (*os.File, error) {
	file, err := WriteTempFile(content)
	if err != nil {
		return nil, err
	}
	return file, file.Close()
}

func GenerateSSHPrivateKey(content string) (string, error) {
	f, err := WriteTempFileAutoClose(content)
	if err != nil {
		return "", err
	}

	return f.Name(), exec.Command("chmod", "600", f.Name()).Run()
}

func UnsafeFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

var base58 = []byte("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

func Base58Encoding(str string) string {
	//1. 转换成ascii码对应的值
	strByte := []byte(str)
	//2. 转换十进制
	strTen := big.NewInt(0).SetBytes(strByte)
	//3. 取出余数
	var modSlice []byte
	for strTen.Cmp(big.NewInt(0)) > 0 {
		mod := big.NewInt(0) //余数
		strTen58 := big.NewInt(58)
		strTen.DivMod(strTen, strTen58, mod)             //取余运算
		modSlice = append(modSlice, base58[mod.Int64()]) //存储余数,并将对应值放入其中
	}
	//  处理0就是1的情况 0使用字节'1'代替
	for _, elem := range strByte {
		if elem != 0 {
			break
		} else if elem == 0 {
			modSlice = append(modSlice, byte('1'))
		}
	}
	ReverseModSlice := ReverseByteArr(modSlice)
	return string(ReverseModSlice)
}

func ReverseByteArr(bytes []byte) []byte { //将字节的数组反转
	for i := 0; i < len(bytes)/2; i++ {
		bytes[i], bytes[len(bytes)-1-i] = bytes[len(bytes)-1-i], bytes[i] //前后交换
	}
	return bytes
}

func Base58Decoding(str string) string { //Base58解码
	strByte := []byte(str)
	//fmt.Println(strByte)  //[81 101 56 68]
	ret := big.NewInt(0)
	for _, byteElem := range strByte {
		index := bytes.IndexByte(base58, byteElem) //获取base58对应数组的下标
		ret.Mul(ret, big.NewInt(58))               //相乘回去
		ret.Add(ret, big.NewInt(int64(index)))     //相加
	}
	return string(ret.Bytes())
}

func Message(ctx context.Context, message string) {
	_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   "提示",
		Message: message,
	})
}

func WarnMessage(ctx context.Context, message string) {
	_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
		Type:    runtime.WarningDialog,
		Title:   "警告",
		Message: message,
	})
}

func ConfirmMessage(ctx context.Context, message string) bool {
	selection, err := runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
		Title:         message,
		Buttons:       []string{"确认", "取消"},
		DefaultButton: "确认",
	})

	return err != nil || selection == "确认"
}

func FilesFilter(list []string) ([]string, error) {
	if len(list) == 1 {
		return list, nil
	}

	var files = map[string]*[]string{}
	var dirs []string
	for _, it := range list {
		stat, err := os.Stat(it)
		if err == os.ErrNotExist {
			continue
		}

		// 如果是目录名，插入到目录list中
		if stat.IsDir() {
			dirs = append(dirs, it)
			continue
		}

		// 分离文件名和目录名，分类到map中
		dir, name := filepath.Split(it)
		if list, ok := files[dir]; ok {
			*list = append(*list, name)
		} else {
			files[dir] = &[]string{name}
		}
	}

	var temp = map[string]interface{}{}
	for prefix, files := range files {
		exclude := false
		for _, dir := range dirs {
			// 如果分离出的文件目录名包含了一个已经存在的目录名
			// 就忽略掉这个目录下的所有文件，只上传目录
			if strings.Contains(prefix, dir) {
				exclude = true
				temp[dir] = nil
				break
			}
		}

		if exclude {
			continue
		}

		temp[fmt.Sprintf("'%s'{'%s'}", prefix, strings.Join(*files, "','"))] = nil
	}

	// 去重加文件存在验证
	var uploadFiles []string
	for k := range temp {
		uploadFiles = append(uploadFiles, k)
	}

	return uploadFiles, nil
}
