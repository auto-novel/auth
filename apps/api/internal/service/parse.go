package service

import (
	"auth/internal/httpx"
	"fmt"
	"math"
	"net/url"
	"time"
)

const (
	defaultPageSize int64 = 50
	maxPageSize     int64 = 100
)

type page struct {
	limit  int64
	offset int64
}

type timeRange struct {
	after  time.Time
	before time.Time
}

func parsePage(query url.Values, defaultPageSize, maxPageSize int64) (page, error) {
	if defaultPageSize <= 0 || maxPageSize < defaultPageSize {
		return page{}, httpx.InternalServerError("分页参数配置无效")
	}
	pageNumber, err := httpx.ParseQueryPositiveInt(query, "page", 1)
	if err != nil {
		return page{}, httpx.BadRequest("页码必须为正整数")
	}
	pageSize, err := httpx.ParseQueryPositiveInt(query, "page_size", defaultPageSize)
	if err != nil {
		return page{}, httpx.BadRequest("每页数量必须为正整数")
	}
	if pageSize > maxPageSize {
		return page{}, httpx.BadRequest(fmt.Sprintf("每页数量不能超过 %d", maxPageSize))
	}
	if pageNumber-1 > math.MaxInt64/pageSize {
		return page{}, httpx.BadRequest("页码超出可支持的范围")
	}
	return page{limit: pageSize, offset: (pageNumber - 1) * pageSize}, nil
}

func parseTimeRange(query url.Values) (timeRange, error) {
	after, err := httpx.ParseQueryUnixTime(query, "created_after")
	if err != nil {
		return timeRange{}, httpx.BadRequest("开始时间必须为 Unix 时间戳")
	}
	before, err := httpx.ParseQueryUnixTime(query, "created_before")
	if err != nil {
		return timeRange{}, httpx.BadRequest("结束时间必须为 Unix 时间戳")
	}
	if !after.IsZero() && !before.IsZero() && after.After(before) {
		return timeRange{}, httpx.BadRequest("开始时间不能晚于结束时间")
	}
	return timeRange{after: after, before: before}, nil
}
