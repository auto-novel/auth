package util

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
)

func Body[T any](r *http.Request) (T, error) {
	var zero T

	contentType := r.Header.Get("Content-Type")
	if contentType != "" && contentType != "application/json" {
		return zero, &HttpError{
			StatusCode: http.StatusUnsupportedMediaType,
			Message:    "expected content-type application/json",
		}
	}

	// 限制读取的最大字节数为1MB
	const maxBytesDefault = 1 << 20
	limitedReader := io.LimitReader(r.Body, maxBytesDefault)
	defer r.Body.Close()

	// 解码JSON
	var result T
	if err := json.NewDecoder(limitedReader).Decode(&result); err != nil {
		return zero, BadRequest("invalid JSON format")
	}

	// 验证JSON
	validate := validator.New(validator.WithRequiredStructEnabled())
	if err := validate.Struct(result); err != nil {
		validationErrorToMessage := func(ve validator.FieldError) string {
			fieldName := ve.Field()
			switch fieldName {
			case "App":
				fieldName = "应用名"
			case "Email":
				fieldName = "邮箱"
			case "Username":
				fieldName = "用户名"
			case "Password":
				fieldName = "密码"
			case "Otp":
				fieldName = "验证码"
			default:
				fieldName = strings.ToLower(fieldName)
			}

			switch ve.Tag() {
			case "required":
				return fmt.Sprintf("%s不能为空", fieldName)
			case "email":
				return fmt.Sprintf("%s必须是有效的邮箱地址", fieldName)
			case "min":
				return fmt.Sprintf("%s至少需要%s个字符", fieldName, ve.Param())
			case "max":
				return fmt.Sprintf("%s不能超过%s个字符", fieldName, ve.Param())
			case "len":
				return fmt.Sprintf("%s长度必须为%s位", fieldName, ve.Param())
			case "numeric":
				return fmt.Sprintf("%s必须是数字", fieldName)
			case "alphanum":
				return fmt.Sprintf("%s只能包含字母和数字", fieldName)
			default:
				return fmt.Sprintf("%s验证失败(%s)", fieldName, ve.Tag())
			}
		}

		errors := err.(validator.ValidationErrors)
		messages := make([]string, len(errors))
		for i, ve := range errors {
			messages[i] = validationErrorToMessage(ve)
		}
		return zero, BadRequest(strings.Join(messages, "; "))
	}

	return result, nil
}

func GetQueryAsInt(query url.Values, key string, defaultValue int64) int64 {
	createAtStr := query.Get(key)
	epochSeconds, err := strconv.ParseInt(createAtStr, 10, 64)
	if err != nil {
		return defaultValue
	}
	return epochSeconds
}

func GetQueryAsTime(query url.Values, key string, defaultValue time.Time) time.Time {
	createAtStr := query.Get(key)
	epochSeconds, err := strconv.ParseInt(createAtStr, 10, 64)
	if err != nil {
		return defaultValue
	}
	return time.Unix(epochSeconds, 0)
}
