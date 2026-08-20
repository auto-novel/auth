package util

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type HttpError struct {
	StatusCode int
	Message    string
}

func (e *HttpError) Error() string {
	return fmt.Sprintf("[%d] %s", e.StatusCode, e.Message)
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

func NotFound(message string) *HttpError {
	return NewHttpError(http.StatusNotFound, message)
}

func Conflict(message string) *HttpError {
	return NewHttpError(http.StatusConflict, message)
}

func InternalServerError(message string) *HttpError {
	return NewHttpError(http.StatusInternalServerError, message)
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
	} else {
		code = http.StatusInternalServerError
		message = err.Error()
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
	fmt.Fprint(w, message)
	return nil
}

func RespondJson[T any](w http.ResponseWriter, response T) error {
	h := w.Header()
	h.Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return InternalServerError("failed to encode response")
	}
	return nil
}
