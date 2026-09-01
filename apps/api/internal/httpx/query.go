package httpx

import (
	"fmt"
	"net/url"
	"strconv"
	"time"
)

func ParseQueryPositiveInt(query url.Values, key string, defaultValue int64) (int64, error) {
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

func ParseQueryUnixTime(query url.Values, key string) (time.Time, error) {
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
