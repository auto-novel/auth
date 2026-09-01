package httpx

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRespondErrorHidesUnhandledError(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	respondError(response, request, errors.New("database connection contains secret details"))

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
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	respondError(response, request, err)
	if response.Code != http.StatusInternalServerError || response.Body.String() != "查询失败" {
		t.Fatalf("RespondError returned (%d, %q)", response.Code, response.Body.String())
	}
}
