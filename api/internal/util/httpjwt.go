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
	RefreshTokenLifetime   = time.Hour * 24 * 90
	AccessTokenLifetime    = time.Hour * 24
)

type refreshClaim = jwt.RegisteredClaims

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

type TokenOptions struct {
	App              string
	Username         string
	Role             string
	CreatedAt        time.Time
	WithRefreshToken bool
}

func RespondAuthTokens(w http.ResponseWriter, opts TokenOptions) error {
	if opts.WithRefreshToken {
		refreshToken, err := issueRefreshToken(opts.Username)
		if err != nil {
			return err
		}
		attachRefreshToken(w, refreshToken, int(RefreshTokenLifetime.Seconds()-60))
	}
	accessToken, err := issueAccessToken(opts.App, opts.Username, opts.Role, opts.CreatedAt)
	if err != nil {
		return err
	}
	return RespondText(w, accessToken)
}

func RespondLogout(w http.ResponseWriter) error {
	attachRefreshToken(w, "", 0)
	return RespondText(w, "")
}

func tokenTTLFor(app string) time.Duration {
	switch app {
	case "legado":
		return time.Hour * 24 * 100
	default:
		return AccessTokenLifetime
	}
}

func issueAccessToken(app string, username string, role string, createdAt time.Time) (string, error) {
	issuedAt := time.Now()
	expiresAt := issuedAt.Add(tokenTTLFor(app))

	claims := accessClaim{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   username,
			Audience:  jwt.ClaimStrings{app},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(issuedAt),
		},
		Role:      role,
		CreatedAt: jwt.NewNumericDate(createdAt),
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

func issueRefreshToken(username string) (string, error) {
	issuedAt := time.Now()
	expiresAt := issuedAt.Add(RefreshTokenLifetime)

	claims := refreshClaim{
		Subject:   username,
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		IssuedAt:  jwt.NewNumericDate(issuedAt),
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
		MaxAge:   int(RefreshTokenLifetime.Seconds() - 60),
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
