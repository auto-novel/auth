package httpx

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/go-playground/validator/v10"
)

type bodyRequest struct {
	Name string `json:"name" label:"名称" validate:"required"`
}

func TestBody(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		body        string
		wantName    string
		wantStatus  int
	}{
		{name: "json", contentType: "application/json", body: `{"name":"test"}`, wantName: "test"},
		{name: "json with charset", contentType: "application/json; charset=utf-8", body: `{"name":"test"}`, wantName: "test"},
		{name: "trailing whitespace", contentType: "application/json", body: "{\"name\":\"test\"}\n\t", wantName: "test"},
		{name: "missing content type", body: `{"name":"test"}`, wantStatus: http.StatusUnsupportedMediaType},
		{name: "wrong content type", contentType: "text/plain", body: `{"name":"test"}`, wantStatus: http.StatusUnsupportedMediaType},
		{name: "malformed content type", contentType: "application/json; charset", body: `{"name":"test"}`, wantStatus: http.StatusUnsupportedMediaType},
		{name: "second JSON value", contentType: "application/json", body: `{"name":"test"}{}`, wantStatus: http.StatusBadRequest},
		{name: "trailing garbage", contentType: "application/json", body: `{"name":"test"}garbage`, wantStatus: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			if tt.contentType != "" {
				request.Header.Set("Content-Type", tt.contentType)
			}

			result, err := Body[bodyRequest](request)
			if tt.wantStatus == 0 {
				if err != nil {
					t.Fatalf("Body returned error: %v", err)
				}
				if result.Name != tt.wantName {
					t.Fatalf("Body returned name %q, want %q", result.Name, tt.wantName)
				}
				return
			}

			var httpErr *HttpError
			if !errors.As(err, &httpErr) {
				t.Fatalf("Body returned %v, want HttpError", err)
			}
			if httpErr.StatusCode != tt.wantStatus {
				t.Fatalf("Body returned status %d, want %d", httpErr.StatusCode, tt.wantStatus)
			}
		})
	}
}

func TestBodyUsesLabelInValidationError(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{}`))
	request.Header.Set("Content-Type", "application/json")

	_, err := Body[bodyRequest](request)
	var httpErr *HttpError
	if !errors.As(err, &httpErr) {
		t.Fatalf("Body returned %v, want HttpError", err)
	}
	if httpErr.StatusCode != http.StatusBadRequest || httpErr.Message != "名称为必填字段" {
		t.Fatalf("Body returned (%d, %q), want (%d, %q)", httpErr.StatusCode, httpErr.Message, http.StatusBadRequest, "名称为必填字段")
	}
}

func TestBodyRejectsRequestLargerThanLimit(t *testing.T) {
	body := append([]byte(`{"name":"test"}`), bytes.Repeat([]byte(" "), (1<<20))...)
	request := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	_, err := Body[bodyRequest](request)
	var httpErr *HttpError
	if !errors.As(err, &httpErr) {
		t.Fatalf("Body returned %v, want HttpError", err)
	}
	if httpErr.StatusCode != http.StatusRequestEntityTooLarge {
		t.Fatalf("Body returned status %d, want %d", httpErr.StatusCode, http.StatusRequestEntityTooLarge)
	}
}

func TestBodyReturnsInternalErrorForInvalidValidationInput(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`1`))
	request.Header.Set("Content-Type", "application/json")

	_, err := Body[int](request)
	var httpErr *HttpError
	if !errors.As(err, &httpErr) {
		t.Fatalf("Body returned %v, want HttpError", err)
	}
	if httpErr.StatusCode != http.StatusInternalServerError {
		t.Fatalf("Body returned status %d, want %d", httpErr.StatusCode, http.StatusInternalServerError)
	}
	var validationErr *validator.InvalidValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("Body returned cause %v, want InvalidValidationError", err)
	}
}

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
