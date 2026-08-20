package util

import (
	"auth/internal/repository"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	RefreshTokenSecret string
	AccessTokenSecret  string
)

const (
	RefreshTokenCookieName = "refresh-token"
)

type refreshClaim struct {
	jwt.RegisteredClaims
}

type accessClaim struct {
	jwt.RegisteredClaims
	Role      string           `json:"role"`
	CreatedAt *jwt.NumericDate `json:"crat"`
}

func VerifyRefreshToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(RefreshTokenCookieName)

	if err != nil {
		return "", Unauthorized("缺少刷新令牌")
	}

	claims, err := parseClaims(cookie.Value, RefreshTokenSecret, &refreshClaim{})
	if err != nil {
		return "", Unauthorized("无效的刷新令牌")
	}

	return claims.Subject, nil
}

func VerifyAccessToken(r *http.Request, requireAdmin bool) (string, error) {
	tokenString := r.Header.Get("Authorization")

	if (tokenString == "") || !strings.HasPrefix(tokenString, "Bearer ") {
		return "", Unauthorized("缺少访问令牌")
	}

	claims, err := parseClaims(tokenString[len("Bearer "):], AccessTokenSecret, &accessClaim{})
	if err != nil {
		return "", Unauthorized("无效的访问令牌")
	}

	if requireAdmin && claims.Role != repository.RoleAdmin {
		return "", Unauthorized("权限不足")
	}

	return claims.Subject, nil
}

type TokenPolicy struct {
	RefreshTokenLifetime time.Duration
	AccessTokenLifetime  time.Duration
}

var defaultTokenPolicy = TokenPolicy{
	RefreshTokenLifetime: time.Hour * 24 * 100,
	AccessTokenLifetime:  time.Hour * 24 * 7,
}
var thirdPartyTokenPolicy = TokenPolicy{
	RefreshTokenLifetime: 0,
	AccessTokenLifetime:  time.Hour * 24 * 100,
}

func getTokenPolicy(app string) TokenPolicy {
	switch app {
	case "legado":
		return thirdPartyTokenPolicy
	default:
		return defaultTokenPolicy
	}
}

type TokenOptions struct {
	App              string
	Username         string
	Role             string
	CreatedAt        time.Time
	WithRefreshToken bool
}

func RespondAuthTokens(w http.ResponseWriter, opts TokenOptions) error {
	policy := getTokenPolicy(opts.App)

	if opts.WithRefreshToken && policy.RefreshTokenLifetime > 0 {
		refreshToken, err := issueRefreshToken(opts, policy)
		if err != nil {
			return err
		}
		attachRefreshToken(w, refreshToken, int(policy.RefreshTokenLifetime.Seconds()))
	}
	accessToken, err := issueAccessToken(opts, policy)
	if err != nil {
		return err
	}
	return RespondText(w, accessToken)
}

func RespondLogout(w http.ResponseWriter) error {
	attachRefreshToken(w, "", 0)
	return RespondText(w, "")
}

func issueAccessToken(opts TokenOptions, policy TokenPolicy) (string, error) {
	issuedAt := time.Now()
	expiresAt := issuedAt.Add(policy.AccessTokenLifetime)

	claims := accessClaim{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   opts.Username,
			Audience:  jwt.ClaimStrings{opts.App},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(issuedAt),
		},
		Role:      opts.Role,
		CreatedAt: jwt.NewNumericDate(opts.CreatedAt),
	}

	token, err := jwt.
		NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(AccessTokenSecret))
	if err != nil {
		slog.Error("Failed to sign access token", "error", err)
		return "", InternalServerError("无法创建访问令牌")
	}

	return token, nil
}

func issueRefreshToken(opts TokenOptions, policy TokenPolicy) (string, error) {
	issuedAt := time.Now()
	expiresAt := issuedAt.Add(policy.RefreshTokenLifetime)

	claims := refreshClaim{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   opts.Username,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(issuedAt),
		},
	}

	token, err := jwt.
		NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(RefreshTokenSecret))
	if err != nil {
		slog.Error("Failed to sign refresh token", "error", err)
		return "", InternalServerError("无法创建刷新令牌")
	}
	return token, nil

}

func attachRefreshToken(w http.ResponseWriter, token string, maxAge int) {
	cookie := &http.Cookie{
		Name:     RefreshTokenCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, cookie)
}

func parseClaims[T jwt.Claims](
	tokenString string,
	secret string,
	claims T,
) (T, error) {
	var zero T

	token, err := jwt.ParseWithClaims(tokenString, claims,
		func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		},
	)
	if err != nil || !token.Valid {
		return zero, err
	}

	validClaims, ok := token.Claims.(T)
	if !ok {
		return zero, jwt.ErrTokenInvalidClaims
	}

	return validClaims, nil
}
