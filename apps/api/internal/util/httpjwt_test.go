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
		{name: "missing subject", token: testAccessToken(t, "", repository.RoleAdmin), wantStatus: http.StatusUnauthorized, wantBody: "无效的访问令牌"},
		{name: "member token", token: testAccessToken(t, "member", repository.RoleMember), wantStatus: http.StatusForbidden, wantBody: "权限不足"},
		{name: "admin token", token: testAccessToken(t, "admin", repository.RoleAdmin), wantStatus: http.StatusOK, wantBody: "admin"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireAdmin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				principal, err := AuthenticatedPrincipal(r)
				if err != nil {
					RespondError(w, err)
					return
				}
				_, _ = io.WriteString(w, principal.Username)
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

func TestRequireAccessTokenStoresPrincipal(t *testing.T) {
	previousSecret := AccessTokenSecret
	AccessTokenSecret = "access-middleware-test-secret"
	t.Cleanup(func() { AccessTokenSecret = previousSecret })

	handler := RequireAccessToken(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		principal, err := AuthenticatedPrincipal(r)
		if err != nil {
			t.Fatalf("AuthenticatedPrincipal returned error: %v", err)
		}
		if principal.UserID != 42 {
			t.Fatalf("principal user ID = %d, want 42", principal.UserID)
		}
		_, _ = io.WriteString(w, principal.Username+":"+principal.Role)
	}))
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Bearer "+testAccessTokenWithUserID(t, 42, "member", repository.RoleMember))
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, req)

	if response.Code != http.StatusOK || response.Body.String() != "member:member" {
		t.Fatalf("RequireAccessToken returned (%d, %q)", response.Code, response.Body.String())
	}
}

func TestAuthenticatedPrincipalRejectsMissingContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	_, err := AuthenticatedPrincipal(req)
	if err == nil {
		t.Fatal("AuthenticatedPrincipal returned nil error")
	}
}

func TestTokenPolicyForApp(t *testing.T) {
	tests := []struct {
		app     string
		wantErr bool
	}{
		{app: AppAuth},
		{app: AppN},
		{app: AppF},
		{app: AppLegado},
		{app: "", wantErr: true},
		{app: "unknown", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.app, func(t *testing.T) {
			_, err := TokenPolicyForApp(tt.app)
			if (err != nil) != tt.wantErr {
				t.Fatalf("TokenPolicyForApp(%q) error = %v, wantErr %v", tt.app, err, tt.wantErr)
			}
		})
	}
}

func testAccessToken(t *testing.T, username, role string) string {
	return testAccessTokenWithUserID(t, 0, username, role)
}

func testAccessTokenWithUserID(t *testing.T, userID int64, username, role string) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"uid":  userID,
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
