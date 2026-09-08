package httpx

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
		name          string
		token         string
		wantStatus    int
		wantBody      string
		wantChallenge string
	}{
		{name: "missing token", wantStatus: http.StatusUnauthorized, wantBody: "缺少访问令牌", wantChallenge: bearerChallenge},
		{name: "missing subject", token: testAccessToken(t, "", repository.RoleAdmin), wantStatus: http.StatusUnauthorized, wantBody: "无效的访问令牌", wantChallenge: invalidAccessTokenChallenge},
		{name: "member token", token: testAccessToken(t, "member", repository.RoleMember), wantStatus: http.StatusForbidden, wantBody: "权限不足"},
		{name: "admin token", token: testAccessToken(t, "admin", repository.RoleAdmin), wantStatus: http.StatusOK, wantBody: "admin"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireAdmin(EH(func(w http.ResponseWriter, r *http.Request) error {
				principal, err := AuthenticatedPrincipal(r)
				if err != nil {
					return err
				}
				_, err = io.WriteString(w, principal.Username)
				return err
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
			challenge := response.Header().Get("WWW-Authenticate")
			if challenge != tt.wantChallenge {
				t.Fatalf("WWW-Authenticate = %q, want %q", challenge, tt.wantChallenge)
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

func TestRequireRoleUsesMinimumLevel(t *testing.T) {
	previousSecret := AccessTokenSecret
	AccessTokenSecret = "role-level-test-secret"
	t.Cleanup(func() { AccessTokenSecret = previousSecret })

	tests := []struct {
		name         string
		requiredRole string
		actualRole   string
		wantStatus   int
	}{
		{name: "admin meets admin", requiredRole: roleAdmin, actualRole: roleAdmin, wantStatus: http.StatusOK},
		{name: "trusted below admin", requiredRole: roleAdmin, actualRole: roleTrusted, wantStatus: http.StatusForbidden},
		{name: "admin exceeds trusted", requiredRole: roleTrusted, actualRole: roleAdmin, wantStatus: http.StatusOK},
		{name: "trusted meets trusted", requiredRole: roleTrusted, actualRole: roleTrusted, wantStatus: http.StatusOK},
		{name: "member below trusted", requiredRole: roleTrusted, actualRole: roleMember, wantStatus: http.StatusForbidden},
		{name: "trusted exceeds member", requiredRole: roleMember, actualRole: roleTrusted, wantStatus: http.StatusOK},
		{name: "restricted below member", requiredRole: roleMember, actualRole: roleRestricted, wantStatus: http.StatusForbidden},
		{name: "unknown role rejected", requiredRole: roleMember, actualRole: "unknown", wantStatus: http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := requireRole(tt.requiredRole)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.Header.Set("Authorization", "Bearer "+testAccessToken(t, "user", tt.actualRole))
			response := httptest.NewRecorder()

			handler.ServeHTTP(response, req)

			if response.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, tt.wantStatus)
			}
		})
	}
}

func TestAuthenticatedPrincipalRejectsMissingContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	_, err := AuthenticatedPrincipal(req)
	if err == nil {
		t.Fatal("AuthenticatedPrincipal returned nil error")
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
