package util

import (
	"auth/internal/repository"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestRequireAdmin(t *testing.T) {
	previousSecret := AccessTokenSecret
	AccessTokenSecret = "admin-middleware-test-secret"
	t.Cleanup(func() { AccessTokenSecret = previousSecret })

	tests := []struct {
		name       string
		token      string
		wantStatus int
		wantBody   string
	}{
		{name: "missing token", wantStatus: http.StatusUnauthorized, wantBody: "缺少访问令牌"},
		{name: "member token", token: testAccessToken(t, "member", repository.RoleMember), wantStatus: http.StatusForbidden, wantBody: "权限不足"},
		{name: "admin token", token: testAccessToken(t, "admin", repository.RoleAdmin), wantStatus: http.StatusOK, wantBody: "admin"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireAdmin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_, _ = io.WriteString(w, AuthenticatedUsername(r))
			}))
			req := httptest.NewRequest(http.MethodGet, "/admin", nil)
			if tt.token != "" {
				req.Header.Set("Authorization", "Bearer "+tt.token)
			}
			response := httptest.NewRecorder()

			handler.ServeHTTP(response, req)

			if response.Code != tt.wantStatus || response.Body.String() != tt.wantBody {
				t.Fatalf("RequireAdmin returned (%d, %q), want (%d, %q)", response.Code, response.Body.String(), tt.wantStatus, tt.wantBody)
			}
		})
	}
}

func testAccessToken(t *testing.T, username, role string) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  username,
		"role": role,
		"exp":  time.Now().Add(time.Hour).Unix(),
	})
	signed, err := token.SignedString([]byte(AccessTokenSecret))
	if err != nil {
		t.Fatalf("sign access token: %v", err)
	}
	return signed
}
