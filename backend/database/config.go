package database

import (
	"fmt"
	"strconv"
)

func GetValue(key string) (string, error) {
	res := ""
	if err := Get().QueryRow("select value from config where key = ?", key).Scan(&res); err != nil {
		return "", err
	}
	return res, nil
}

func GetValueInt(key string) (int, error) {
	value, err := GetValue(key)
	if err != nil || value == "" {
		return 0, err
	}

	parseInt, err := strconv.ParseInt(value, 10, 32)
	return int(parseInt), err
}

func KeyExist(key string) (bool, error) {
	count := 0
	if err := Get().QueryRow("select count(1) from config where key = ?", key).Scan(&count); err != nil {
		return false, err
	}

	if count == 0 {
		return false, nil
	}

	return true, nil
}

func CreateIfNotExist(key, defaultValue string) (bool, error) {
	exist, err := KeyExist(key)
	if err != nil {
		return false, err
	}

	if exist {
		return true, nil
	}

	stmt, err := Get().Prepare(`insert into config (key, value) values (?, ?)`)
	if err != nil {
		return false, err
	}

	_, err = stmt.Exec(key, defaultValue)
	return false, err
}

func IntValueInc(key string) error {
	if _, err := CreateIfNotExist(key, "0"); err != nil {
		return err
	}

	sumCount, err := GetValueInt(key)
	if err != nil {
		return err
	}

	return UpdateValueByKey(key, fmt.Sprintf("%d", sumCount+1))
}

func UpdateValueByKey(key, value string) error {
	exists, err := CreateIfNotExist(key, value)
	if err != nil {
		return err
	}

	if exists {
		stmt, err := Get().Prepare("update config set value = ? where key = ?")
		if err != nil {
			return err
		}

		_, err = stmt.Exec(value, key)
		return err
	}
	return nil
}
