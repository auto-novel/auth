package service

import (
	"auth/internal/httpx"
	"fmt"
	"math"
	"net/url"
	"time"
)

const (
	DefaultPageSize int64 = 50
	MaxPageSize     int64 = 100
)

type Page struct {
	Limit  int64
	Offset int64
}

type TimeRange struct {
	After  time.Time
	Before time.Time
}

type PageResponse[T any] struct {
	Total int64 `json:"total"`
	Items []T   `json:"items"`
}

func ParsePage(query url.Values, defaultPageSize, maxPageSize int64) (Page, error) {
	if defaultPageSize <= 0 || maxPageSize < defaultPageSize {
		return Page{}, httpx.InternalServerError("分页参数配置无效")
	}
	pageNumber, err := httpx.ParseQueryPositiveInt(query, "page", 1)
	if err != nil {
		return Page{}, httpx.BadRequest("页码必须为正整数")
	}
	pageSize, err := httpx.ParseQueryPositiveInt(query, "page_size", defaultPageSize)
	if err != nil {
		return Page{}, httpx.BadRequest("每页数量必须为正整数")
	}
	if pageSize > maxPageSize {
		return Page{}, httpx.BadRequest(fmt.Sprintf("每页数量不能超过 %d", maxPageSize))
	}
	if pageNumber-1 > math.MaxInt64/pageSize {
		return Page{}, httpx.BadRequest("页码超出可支持的范围")
	}
	return Page{Limit: pageSize, Offset: (pageNumber - 1) * pageSize}, nil
}

func ParseTimeRange(query url.Values) (TimeRange, error) {
	after, err := httpx.ParseQueryUnixTime(query, "created_after")
	if err != nil {
		return TimeRange{}, httpx.BadRequest("开始时间必须为 Unix 时间戳")
	}
	before, err := httpx.ParseQueryUnixTime(query, "created_before")
	if err != nil {
		return TimeRange{}, httpx.BadRequest("结束时间必须为 Unix 时间戳")
	}
	if !after.IsZero() && !before.IsZero() && after.After(before) {
		return TimeRange{}, httpx.BadRequest("开始时间不能晚于结束时间")
	}
	return TimeRange{After: after, Before: before}, nil
}
