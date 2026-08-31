package httpx

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type failingJSONMarshaler struct {
	err error
}

func (m failingJSONMarshaler) MarshalJSON() ([]byte, error) {
	return nil, m.err
}

type failingResponseWriter struct {
	header     http.Header
	statusCode int
	err        error
}

func (w *failingResponseWriter) Header() http.Header {
	return w.header
}

func (w *failingResponseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
}

func (w *failingResponseWriter) Write([]byte) (int, error) {
	return 0, w.err
}

func TestRespondErrorHidesUnhandledError(t *testing.T) {
	response := httptest.NewRecorder()
	RespondError(response, errors.New("database connection contains secret details"))

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("RespondError returned status %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if response.Body.String() != "服务器内部错误" {
		t.Fatalf("RespondError returned body %q", response.Body.String())
	}
}

func TestInternalErrorPreservesPublicMessageAndCause(t *testing.T) {
	cause := errors.New("database unavailable")
	err := InternalError(cause, "查询失败")
	if !errors.Is(err, cause) {
		t.Fatal("InternalError did not preserve its cause")
	}

	response := httptest.NewRecorder()
	RespondError(response, err)
	if response.Code != http.StatusInternalServerError || response.Body.String() != "查询失败" {
		t.Fatalf("RespondError returned (%d, %q)", response.Code, response.Body.String())
	}
}

func TestRespondTextPreservesWriteError(t *testing.T) {
	cause := errors.New("write failed")
	response := &failingResponseWriter{
		header: make(http.Header),
		err:    cause,
	}

	err := RespondText(response, "response")
	if !errors.Is(err, cause) {
		t.Fatalf("RespondText returned %v, want error wrapping %v", err, cause)
	}

	var httpErr *HttpError
	if !errors.As(err, &httpErr) || httpErr.StatusCode != http.StatusInternalServerError {
		t.Fatalf("RespondText returned %v, want internal server error", err)
	}
	if response.statusCode != http.StatusOK {
		t.Fatalf("RespondText wrote status %d, want %d", response.statusCode, http.StatusOK)
	}
}

func TestRespondJsonDoesNotCommitSuccessBeforeEncoding(t *testing.T) {
	cause := errors.New("marshal failed")
	response := httptest.NewRecorder()

	err := RespondJson(response, failingJSONMarshaler{err: cause})
	if !errors.Is(err, cause) {
		t.Fatalf("RespondJson returned %v, want error wrapping %v", err, cause)
	}
	if response.Body.Len() != 0 || response.Header().Get("Content-Type") != "" {
		t.Fatalf("RespondJson committed response before encoding succeeded: headers=%v body=%q", response.Header(), response.Body.String())
	}

	var httpErr *HttpError
	if !errors.As(err, &httpErr) || httpErr.StatusCode != http.StatusInternalServerError {
		t.Fatalf("RespondJson returned %v, want internal server error", err)
	}
}

func TestEHReturnsInternalServerErrorWhenJSONEncodingFails(t *testing.T) {
	cause := errors.New("marshal failed")
	response := httptest.NewRecorder()
	handler := EH(func(w http.ResponseWriter, _ *http.Request) error {
		return RespondJson(w, failingJSONMarshaler{err: cause})
	})

	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("handler returned status %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if response.Body.String() != "failed to encode response" {
		t.Fatalf("handler returned body %q", response.Body.String())
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "text/plain; charset=utf-8" {
		t.Fatalf("handler returned Content-Type %q", contentType)
	}
}
