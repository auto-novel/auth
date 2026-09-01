package auth

import (
	"auth/internal/authn"
	"auth/internal/infra"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestIssuedAccessTokenCanBeAuthenticated(t *testing.T) {
	previousAuthnSecret := authn.AccessTokenSecret
	previousIssuerSecret := infra.AccessTokenSecret
	authn.AccessTokenSecret = "access-token-contract-test-secret"
	infra.AccessTokenSecret = authn.AccessTokenSecret
	t.Cleanup(func() {
		authn.AccessTokenSecret = previousAuthnSecret
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

	handler := authn.RequireAccessToken(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		principal, err := authn.AuthenticatedPrincipal(r)
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
