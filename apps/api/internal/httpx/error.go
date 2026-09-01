package httpx

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/render"
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
			respondError(w, r, err)
			return
		}
	}
}

func respondError(w http.ResponseWriter, r *http.Request, err error) {
	var code int
	var message string

	var httpErr *HttpError
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

	header := w.Header()
	header.Del("Content-Length")
	header.Set("X-Content-Type-Options", "nosniff")
	render.Status(r, code)
	render.PlainText(w, r, message)
}
