package httpx

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
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

type Pagination struct {
	Limit  int64
	Offset int64
}

type TimeRange struct {
	After  time.Time
	Before time.Time
}

func ParsePagination(query url.Values, defaultPageSize, maxPageSize int64) (Pagination, error) {
	if defaultPageSize <= 0 || maxPageSize < defaultPageSize {
		return Pagination{}, InternalServerError("分页参数配置无效")
	}
	page, err := getPositiveQueryInt(query, "page", 1)
	if err != nil {
		return Pagination{}, err
	}
	pageSize, err := getPositiveQueryInt(query, "page_size", defaultPageSize)
	if err != nil {
		return Pagination{}, err
	}
	if pageSize > maxPageSize {
		return Pagination{}, BadRequest(fmt.Sprintf("page_size 不能超过 %d", maxPageSize))
	}
	if page-1 > math.MaxInt64/pageSize {
		return Pagination{}, BadRequest("page 超出可支持的范围")
	}
	return Pagination{Limit: pageSize, Offset: (page - 1) * pageSize}, nil
}

func getPositiveQueryInt(query url.Values, key string, defaultValue int64) (int64, error) {
	value := query.Get(key)
	if value == "" {
		return defaultValue, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil || parsed <= 0 {
		return 0, BadRequest(fmt.Sprintf("%s 必须为正整数", key))
	}
	return parsed, nil
}

func ParseTimeRange(query url.Values) (TimeRange, error) {
	after, err := parseOptionalUnixTime(query, "created_after")
	if err != nil {
		return TimeRange{}, err
	}
	before, err := parseOptionalUnixTime(query, "created_before")
	if err != nil {
		return TimeRange{}, err
	}
	if !after.IsZero() && !before.IsZero() && after.After(before) {
		return TimeRange{}, BadRequest("created_after 不能晚于 created_before")
	}
	return TimeRange{After: after, Before: before}, nil
}

func parseOptionalUnixTime(query url.Values, key string) (time.Time, error) {
	value := query.Get(key)
	if value == "" {
		return time.Time{}, nil
	}
	epochSeconds, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return time.Time{}, BadRequest(fmt.Sprintf("%s 必须为 Unix 时间戳", key))
	}
	return time.Unix(epochSeconds, 0), nil
}
