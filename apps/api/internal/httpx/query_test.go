package httpx

import (
	"errors"
	"net/http"
	"net/url"
	"testing"
	"time"
)

func TestParseQueryPositiveInt(t *testing.T) {
	tests := []struct {
		name         string
		query        url.Values
		key          string
		defaultValue int64
		want         int64
		wantMessage  string
	}{
		{name: "default", query: url.Values{}, key: "page", defaultValue: 1, want: 1},
		{name: "value", query: url.Values{"page": {"2"}}, key: "page", defaultValue: 1, want: 2},
		{name: "invalid", query: url.Values{"page": {"invalid"}}, key: "page", defaultValue: 1, wantMessage: "page 必须为正整数"},
		{name: "zero", query: url.Values{"page": {"0"}}, key: "page", defaultValue: 1, wantMessage: "page 必须为正整数"},
		{name: "negative", query: url.Values{"page": {"-1"}}, key: "page", defaultValue: 1, wantMessage: "page 必须为正整数"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseQueryPositiveInt(tt.query, tt.key, tt.defaultValue)
			if tt.wantMessage == "" {
				if err != nil {
					t.Fatalf("ParseQueryPositiveInt returned error: %v", err)
				}
				if got != tt.want {
					t.Fatalf("ParseQueryPositiveInt returned %d, want %d", got, tt.want)
				}
				return
			}

			var httpErr *HttpError
			if !errors.As(err, &httpErr) {
				t.Fatalf("ParseQueryPositiveInt returned %v, want HttpError", err)
			}
			if httpErr.StatusCode != http.StatusBadRequest || httpErr.Message != tt.wantMessage {
				t.Fatalf("ParseQueryPositiveInt returned (%d, %q), want (%d, %q)", httpErr.StatusCode, httpErr.Message, http.StatusBadRequest, tt.wantMessage)
			}
		})
	}
}

func TestParseQueryUnixTime(t *testing.T) {
	tests := []struct {
		name        string
		query       url.Values
		want        time.Time
		wantMessage string
	}{
		{name: "empty", query: url.Values{}},
		{name: "numeric timestamp", query: url.Values{"created_after": {"100"}}, want: time.Unix(100, 0)},
		{name: "negative timestamp", query: url.Values{"created_after": {"-100"}}, want: time.Unix(-100, 0)},
		{name: "invalid", query: url.Values{"created_after": {"invalid"}}, wantMessage: "created_after 必须为 Unix 时间戳"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseQueryUnixTime(tt.query, "created_after")
			if tt.wantMessage == "" {
				if err != nil {
					t.Fatalf("ParseQueryUnixTime returned error: %v", err)
				}
				if !got.Equal(tt.want) {
					t.Fatalf("ParseQueryUnixTime returned %v, want %v", got, tt.want)
				}
				return
			}

			var httpErr *HttpError
			if !errors.As(err, &httpErr) {
				t.Fatalf("ParseQueryUnixTime returned %v, want HttpError", err)
			}
			if httpErr.StatusCode != http.StatusBadRequest || httpErr.Message != tt.wantMessage {
				t.Fatalf("ParseQueryUnixTime returned (%d, %q), want (%d, %q)", httpErr.StatusCode, httpErr.Message, http.StatusBadRequest, tt.wantMessage)
			}
		})
	}
}
