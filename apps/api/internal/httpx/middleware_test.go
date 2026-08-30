package httpx

import (
	"net/http/httptest"
	"testing"
)

func TestGetRealIp(t *testing.T) {
	tests := []struct {
		name       string
		remoteAddr string
		headers    map[string]string
		want       string
	}{
		{
			name:       "cloudflare takes precedence over docker proxy",
			remoteAddr: "172.20.0.1:54321",
			headers: map[string]string{
				"CF-Connecting-IP": "203.0.113.10",
				"X-Forwarded-For":  "172.20.0.1",
			},
			want: "203.0.113.10",
		},
		{
			name:       "first forwarded address",
			remoteAddr: "172.20.0.1:54321",
			headers: map[string]string{
				"X-Forwarded-For": "198.51.100.20, 172.20.0.1",
			},
			want: "198.51.100.20",
		},
		{
			name:       "invalid proxy header falls back to remote address",
			remoteAddr: "192.0.2.30:54321",
			headers: map[string]string{
				"CF-Connecting-IP": "not-an-ip",
			},
			want: "192.0.2.30",
		},
		{
			name:       "ipv6 is canonicalized",
			remoteAddr: "[2001:db8::1]:54321",
			want:       "2001:db8::1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest("GET", "/", nil)
			r.RemoteAddr = tt.remoteAddr
			for name, value := range tt.headers {
				r.Header.Set(name, value)
			}

			if got := GetRealIp(r); got != tt.want {
				t.Fatalf("GetRealIp() = %q, want %q", got, tt.want)
			}
		})
	}
}
