package authn

import (
	"auth/internal/httpx"
	"log/slog"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	RefreshTokenSecret string
	AccessTokenSecret  string
)

const (
	RefreshTokenCookieName = "refresh-token"
	AppAuth                = "auth"
	AppN                   = "n"
	AppF                   = "f"
	AppLegado              = "legado"
)

type refreshClaim struct {
	jwt.RegisteredClaims
}

type accessClaim struct {
	jwt.RegisteredClaims
	UserID    int64            `json:"uid"`
	Role      string           `json:"role"`
	CreatedAt *jwt.NumericDate `json:"crat"`
}

func VerifyRefreshToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(RefreshTokenCookieName)

	if err != nil {
		return "", httpx.Unauthorized("缺少刷新令牌")
	}

	claims, err := parseClaims(cookie.Value, RefreshTokenSecret, &refreshClaim{})
	if err != nil {
		return "", httpx.Unauthorized("无效的刷新令牌")
	}

	return claims.Subject, nil
}

type TokenPolicy struct {
	RefreshTokenLifetime time.Duration
	AccessTokenLifetime  time.Duration
}

var tokenPolicies = map[string]TokenPolicy{
	AppAuth: {
		RefreshTokenLifetime: time.Hour * 24 * 100,
		AccessTokenLifetime:  time.Hour * 24 * 7,
	},
	AppN: {
		RefreshTokenLifetime: time.Hour * 24 * 100,
		AccessTokenLifetime:  time.Hour * 24 * 7,
	},
	AppF: {
		RefreshTokenLifetime: time.Hour * 24 * 100,
		AccessTokenLifetime:  time.Hour * 24 * 7,
	},
	AppLegado: {
		RefreshTokenLifetime: 0,
		AccessTokenLifetime:  time.Hour * 24 * 100,
	},
}

func TokenPolicyForApp(app string) (TokenPolicy, error) {
	policy, ok := tokenPolicies[app]
	if !ok {
		return TokenPolicy{}, httpx.BadRequest("未知的应用")
	}
	return policy, nil
}

type TokenOptions struct {
	App              string
	UserID           int64
	Username         string
	Role             string
	CreatedAt        time.Time
	WithRefreshToken bool
}

func RespondAuthTokens(w http.ResponseWriter, opts TokenOptions) error {
	policy, err := TokenPolicyForApp(opts.App)
	if err != nil {
		return err
	}

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
	return httpx.RespondText(w, accessToken)
}

func RespondLogout(w http.ResponseWriter) error {
	attachRefreshToken(w, "", 0)
	return httpx.RespondText(w, "")
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
		UserID:    opts.UserID,
		Role:      opts.Role,
		CreatedAt: jwt.NewNumericDate(opts.CreatedAt),
	}

	token, err := jwt.
		NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(AccessTokenSecret))
	if err != nil {
		slog.Error("Failed to sign access token", "error", err)
		return "", httpx.InternalError(err, "无法创建访问令牌")
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
		return "", httpx.InternalError(err, "无法创建刷新令牌")
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
