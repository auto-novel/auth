package service

import (
	"auth/internal/httpx"
	"errors"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"testing"
	"time"
)

func TestParsePage(t *testing.T) {
	largestPage := math.MaxInt64/defaultPageSize + 1
	tests := []struct {
		name        string
		query       url.Values
		wantLimit   int64
		wantOffset  int64
		wantMessage string
	}{
		{name: "defaults", query: url.Values{}, wantLimit: defaultPageSize},
		{name: "values", query: url.Values{"page": {"2"}, "page_size": {"100"}}, wantLimit: 100, wantOffset: 100},
		{name: "largest offset", query: url.Values{"page": {strconv.FormatInt(largestPage, 10)}}, wantLimit: defaultPageSize, wantOffset: (largestPage - 1) * defaultPageSize},
		{name: "invalid page", query: url.Values{"page": {"invalid"}}, wantMessage: "页码必须为正整数"},
		{name: "invalid page size", query: url.Values{"page_size": {"invalid"}}, wantMessage: "每页数量必须为正整数"},
		{name: "page size over limit", query: url.Values{"page_size": {"101"}}, wantMessage: "每页数量不能超过 100"},
		{name: "offset overflow", query: url.Values{"page": {strconv.FormatInt(largestPage+1, 10)}}, wantMessage: "页码超出可支持的范围"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parsePage(tt.query, defaultPageSize, maxPageSize)
			if tt.wantMessage == "" {
				if err != nil {
					t.Fatalf("parsePage returned error: %v", err)
				}
				if got.limit != tt.wantLimit || got.offset != tt.wantOffset {
					t.Fatalf("parsePage returned (%d, %d), want (%d, %d)", got.limit, got.offset, tt.wantLimit, tt.wantOffset)
				}
				return
			}

			assertBadRequest(t, err, tt.wantMessage)
		})
	}
}

func TestParsePageRejectsInvalidConfiguration(t *testing.T) {
	_, err := parsePage(url.Values{}, 0, 100)
	var httpErr *httpx.HttpError
	if !errors.As(err, &httpErr) {
		t.Fatalf("parsePage returned %v, want HttpError", err)
	}
	if httpErr.StatusCode != http.StatusInternalServerError || httpErr.Message != "分页参数配置无效" {
		t.Fatalf("parsePage returned (%d, %q), want (%d, %q)", httpErr.StatusCode, httpErr.Message, http.StatusInternalServerError, "分页参数配置无效")
	}
}

func TestParseTimeRange(t *testing.T) {
	tests := []struct {
		name        string
		query       url.Values
		wantAfter   time.Time
		wantBefore  time.Time
		wantMessage string
	}{
		{name: "empty", query: url.Values{}},
		{
			name:       "values",
			query:      url.Values{"created_after": {"100"}, "created_before": {"200"}},
			wantAfter:  time.Unix(100, 0),
			wantBefore: time.Unix(200, 0),
		},
		{name: "invalid after", query: url.Values{"created_after": {"invalid"}}, wantMessage: "开始时间必须为 Unix 时间戳"},
		{name: "invalid before", query: url.Values{"created_before": {"invalid"}}, wantMessage: "结束时间必须为 Unix 时间戳"},
		{name: "reversed", query: url.Values{"created_after": {"200"}, "created_before": {"100"}}, wantMessage: "开始时间不能晚于结束时间"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseTimeRange(tt.query)
			if tt.wantMessage == "" {
				if err != nil {
					t.Fatalf("parseTimeRange returned error: %v", err)
				}
				if !got.after.Equal(tt.wantAfter) || !got.before.Equal(tt.wantBefore) {
					t.Fatalf("parseTimeRange returned (%v, %v), want (%v, %v)", got.after, got.before, tt.wantAfter, tt.wantBefore)
				}
				return
			}

			assertBadRequest(t, err, tt.wantMessage)
		})
	}
}

func assertBadRequest(t *testing.T, err error, wantMessage string) {
	t.Helper()
	var httpErr *httpx.HttpError
	if !errors.As(err, &httpErr) {
		t.Fatalf("returned %v, want HttpError", err)
	}
	if httpErr.StatusCode != http.StatusBadRequest || httpErr.Message != wantMessage {
		t.Fatalf("returned (%d, %q), want (%d, %q)", httpErr.StatusCode, httpErr.Message, http.StatusBadRequest, wantMessage)
	}
}
