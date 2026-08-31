package httpx

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
)

type HttpError struct {
	StatusCode int
	Message    string
	Cause      error
}

func (e *HttpError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%d] %s: %v", e.StatusCode, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%d] %s", e.StatusCode, e.Message)
}

func (e *HttpError) Unwrap() error {
	return e.Cause
}

func NewHttpError(statusCode int, message string) *HttpError {
	return &HttpError{
		StatusCode: statusCode,
		Message:    message,
	}
}

func BadRequest(message string) *HttpError {
	return NewHttpError(http.StatusBadRequest, message)
}

func Unauthorized(message string) *HttpError {
	return NewHttpError(http.StatusUnauthorized, message)
}

func Forbidden(message string) *HttpError {
	return NewHttpError(http.StatusForbidden, message)
}

func NotFound(message string) *HttpError {
	return NewHttpError(http.StatusNotFound, message)
}

func Conflict(message string) *HttpError {
	return NewHttpError(http.StatusConflict, message)
}

func InternalServerError(message string) *HttpError {
	return NewHttpError(http.StatusInternalServerError, message)
}

func InternalError(cause error, message string) *HttpError {
	return &HttpError{
		StatusCode: http.StatusInternalServerError,
		Message:    message,
		Cause:      cause,
	}
}

func EH(f func(http.ResponseWriter, *http.Request) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := f(w, r)
		if err != nil {
			RespondError(w, err)
			return
		}
	}
}

// 修复http.Error的额外换行符问题
func RespondError(w http.ResponseWriter, err error) {
	var code int
	var message string

	httpErr := &HttpError{}
	if errors.As(err, &httpErr) {
		code = httpErr.StatusCode
		message = httpErr.Message
		if code >= http.StatusInternalServerError {
			slog.Error("Request failed", "status", code, "error", err)
		}
	} else {
		code = http.StatusInternalServerError
		message = "服务器内部错误"
		slog.Error("Unhandled request error", "status", code, "error", err)
	}

	h := w.Header()
	h.Del("Content-Length")
	h.Set("Content-Type", "text/plain; charset=utf-8")
	h.Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

func RespondText(w http.ResponseWriter, message string) error {
	h := w.Header()
	h.Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	if _, err := fmt.Fprint(w, message); err != nil {
		return InternalError(err, "failed to write response")
	}
	return nil
}

func RespondJson[T any](w http.ResponseWriter, response T) error {
	var body bytes.Buffer
	if err := json.NewEncoder(&body).Encode(response); err != nil {
		return InternalError(err, "failed to encode response")
	}

	h := w.Header()
	h.Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, err := body.WriteTo(w); err != nil {
		return InternalError(err, "failed to write response")
	}
	return nil
}
