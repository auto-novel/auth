package httpx

import (
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/httplog/v3"
	"github.com/go-chi/httprate"
)

func RateLimiter(limit int) func(next http.Handler) http.Handler {
	return httprate.Limit(limit, time.Hour,
		httprate.WithKeyFuncs(func(r *http.Request) (string, error) {
			return GetRealIp(r), nil
		}),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "操作过于频繁，请稍后再试", http.StatusTooManyRequests)
		}),
	)
}

func GetRealIp(r *http.Request) string {
	// Cloudflare preserves the original client address in CF-Connecting-IP.
	// The other headers cover direct requests through conventional proxies.
	for _, candidate := range []string{
		r.Header.Get("CF-Connecting-IP"),
		r.Header.Get("True-Client-IP"),
		r.Header.Get("X-Real-IP"),
		firstForwardedIp(r.Header.Get("X-Forwarded-For")),
	} {
		if ip := canonicalIp(candidate); ip != "" {
			return ip
		}
	}

	if host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr)); err == nil {
		if ip := canonicalIp(host); ip != "" {
			return ip
		}
	}
	if ip := canonicalIp(r.RemoteAddr); ip != "" {
		return ip
	}

	return strings.TrimSpace(r.RemoteAddr)
}

func firstForwardedIp(value string) string {
	if ip, _, found := strings.Cut(value, ","); found {
		return ip
	}
	return value
}

func canonicalIp(value string) string {
	ip := net.ParseIP(strings.TrimSpace(value))
	if ip == nil {
		return ""
	}
	return ip.String()
}

func RequestLogger() func(next http.Handler) http.Handler {
	return httplog.RequestLogger(slog.Default(), &httplog.Options{
		Level:         slog.LevelInfo,
		Schema:        httplog.SchemaECS,
		RecoverPanics: true,
	})
}
