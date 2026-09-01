package auth

import (
	"auth/internal/httpx"
	"auth/internal/infra"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestIssuedAccessTokenCanBeAuthenticated(t *testing.T) {
	previousAccessTokenSecret := httpx.AccessTokenSecret
	previousIssuerSecret := infra.AccessTokenSecret
	httpx.AccessTokenSecret = "access-token-contract-test-secret"
	infra.AccessTokenSecret = httpx.AccessTokenSecret
	t.Cleanup(func() {
		httpx.AccessTokenSecret = previousAccessTokenSecret
		infra.AccessTokenSecret = previousIssuerSecret
	})

	token, err := infra.IssueAccessToken(infra.TokenOptions{
		App:       infra.AppAuth,
		UserID:    42,
		Username:  "member",
		Role:      "member",
		CreatedAt: time.Now(),
	}, time.Hour)
	if err != nil {
		t.Fatalf("IssueAccessToken returned error: %v", err)
	}

	handler := httpx.RequireAccessToken(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		principal, err := httpx.AuthenticatedPrincipal(r)
		if err != nil {
			t.Fatalf("AuthenticatedPrincipal returned error: %v", err)
		}
		if principal.UserID != 42 || principal.Username != "member" || principal.Role != "member" {
			t.Fatalf("unexpected principal: %+v", principal)
		}
	}))
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, req)

	if response.Code != http.StatusOK {
		t.Fatalf("authentication returned status %d", response.Code)
	}
}
