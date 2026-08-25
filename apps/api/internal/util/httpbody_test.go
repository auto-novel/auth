package util

import (
	"errors"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"testing"
)

func TestParsePagination(t *testing.T) {
	const (
		defaultPageSize int64 = 50
		maxPageSize     int64 = 100
	)
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
		{name: "invalid page", query: url.Values{"page": {"invalid"}}, wantMessage: "page 必须为正整数"},
		{name: "zero page", query: url.Values{"page": {"0"}}, wantMessage: "page 必须为正整数"},
		{name: "invalid page size", query: url.Values{"page_size": {"invalid"}}, wantMessage: "page_size 必须为正整数"},
		{name: "zero page size", query: url.Values{"page_size": {"0"}}, wantMessage: "page_size 必须为正整数"},
		{name: "page size over limit", query: url.Values{"page_size": {"101"}}, wantMessage: "page_size 不能超过 100"},
		{name: "offset overflow", query: url.Values{"page": {strconv.FormatInt(largestPage+1, 10)}}, wantMessage: "page 超出可支持的范围"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			limit, offset, err := ParsePagination(tt.query, defaultPageSize, maxPageSize)
			if tt.wantMessage == "" {
				if err != nil {
					t.Fatalf("ParsePagination returned error: %v", err)
				}
				if limit != tt.wantLimit || offset != tt.wantOffset {
					t.Fatalf("ParsePagination returned (%d, %d), want (%d, %d)", limit, offset, tt.wantLimit, tt.wantOffset)
				}
				return
			}

			var httpErr *HttpError
			if !errors.As(err, &httpErr) {
				t.Fatalf("ParsePagination returned %v, want HttpError", err)
			}
			if httpErr.StatusCode != http.StatusBadRequest || httpErr.Message != tt.wantMessage {
				t.Fatalf("ParsePagination returned (%d, %q), want (%d, %q)", httpErr.StatusCode, httpErr.Message, http.StatusBadRequest, tt.wantMessage)
			}
		})
	}
}

func TestParsePaginationRejectsInvalidConfiguration(t *testing.T) {
	_, _, err := ParsePagination(url.Values{}, 0, 100)
	var httpErr *HttpError
	if !errors.As(err, &httpErr) {
		t.Fatalf("ParsePagination returned %v, want HttpError", err)
	}
	if httpErr.StatusCode != http.StatusInternalServerError {
		t.Fatalf("ParsePagination returned status %d, want %d", httpErr.StatusCode, http.StatusInternalServerError)
	}
}
