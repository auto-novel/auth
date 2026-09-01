package authn

import (
	"auth/internal/httpx"
	"auth/internal/repository"
	"context"
	"net/http"
	"strings"
)

type Principal struct {
	UserID   int64
	Username string
	Role     string
}

type principalContextKey struct{}

func verifyAccessToken(r *http.Request) (Principal, error) {
	tokenString := r.Header.Get("Authorization")

	if tokenString == "" || !strings.HasPrefix(tokenString, "Bearer ") {
		return Principal{}, httpx.Unauthorized("缺少访问令牌")
	}

	claims, err := parseClaims(tokenString[len("Bearer "):], AccessTokenSecret, &accessClaim{})
	if err != nil {
		return Principal{}, httpx.Unauthorized("无效的访问令牌")
	}
	if claims.Subject == "" {
		return Principal{}, httpx.Unauthorized("无效的访问令牌")
	}

	return Principal{UserID: claims.UserID, Username: claims.Subject, Role: claims.Role}, nil
}

func RequireAccessToken(next http.Handler) http.Handler {
	return httpx.EH(func(w http.ResponseWriter, r *http.Request) error {
		principal, err := verifyAccessToken(r)
		if err != nil {
			return err
		}
		ctx := context.WithValue(r.Context(), principalContextKey{}, principal)
		next.ServeHTTP(w, r.WithContext(ctx))
		return nil
	})
}

func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return RequireAccessToken(httpx.EH(func(w http.ResponseWriter, r *http.Request) error {
			principal, err := AuthenticatedPrincipal(r)
			if err != nil {
				return err
			}
			if principal.Role != role {
				return httpx.Forbidden("权限不足")
			}
			next.ServeHTTP(w, r)
			return nil
		}))
	}
}

func RequireAdmin(next http.Handler) http.Handler {
	return RequireRole(repository.RoleAdmin)(next)
}

func AuthenticatedPrincipal(r *http.Request) (Principal, error) {
	principal, ok := r.Context().Value(principalContextKey{}).(Principal)
	if !ok || principal.Username == "" {
		return Principal{}, httpx.Unauthorized("缺少认证上下文")
	}
	return principal, nil
}
