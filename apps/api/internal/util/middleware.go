package util

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/httplog/v3"
	"github.com/go-chi/httprate"
)

func RateLimiter(limit int) func(next http.Handler) http.Handler {
	return httprate.Limit(limit, time.Hour,
		httprate.WithKeyFuncs(httprate.KeyByRealIP),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "操作过于频繁，请稍后再试", http.StatusTooManyRequests)
		}),
	)
}

func GetRealIp(r *http.Request) string {
	if ip := r.Header.Get("True-Client-IP"); ip != "" {
		return ip
	} else if ip := r.Header.Get("X-Real-Ip"); ip != "" {
		return ip
	} else if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return ip
	} else {
		return r.RemoteAddr
	}
}

func RequestLogger() func(next http.Handler) http.Handler {
	return httplog.RequestLogger(slog.Default(), &httplog.Options{
		Level:         slog.LevelInfo,
		Schema:        httplog.SchemaECS,
		RecoverPanics: true,
	})
}
