package util

import (
	"strings"
	"unicode"
)

func ValidUsername(username string) error {
	if strings.TrimSpace(username) != username {
		return BadRequest("用户名前后不能有空格")
	}
	for _, r := range username {
		if !unicode.IsPrint(r) {
			return BadRequest("用户名只能包含可打印字符")
		}
		if r == '@' {
			return BadRequest("用户名不能包含@字符")
		}
	}
	return nil
}

func ValidPassword(password string) error {
	for _, r := range password {
		if !unicode.IsPrint(r) {
			return BadRequest("密码只能包含可打印字符")
		}
		if unicode.IsSpace(r) {
			return BadRequest("密码不能包含空格")
		}
	}
	return nil
}
