package service

import (
	"auth/internal/httpx"
	"auth/internal/infra"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/render"
)

const (
	RefreshTokenCookieName = "refresh-token"
)

func tokenPolicyForApp(app string) (infra.TokenPolicy, error) {
	policy, ok := infra.TokenPolicyForApp(app)
	if !ok {
		return infra.TokenPolicy{}, httpx.BadRequest("未知的应用")
	}
	return policy, nil
}

type tokenOptions struct {
	App              string
	UserID           int64
	Username         string
	Role             string
	CreatedAt        time.Time
	WithRefreshToken bool
}

func respondAuthTokens(w http.ResponseWriter, r *http.Request, opts tokenOptions) error {
	policy, err := tokenPolicyForApp(opts.App)
	if err != nil {
		return err
	}

	infraOpts := infra.TokenOptions{
		App:       opts.App,
		UserID:    opts.UserID,
		Username:  opts.Username,
		Role:      opts.Role,
		CreatedAt: opts.CreatedAt,
	}
	if opts.WithRefreshToken && policy.RefreshTokenLifetime > 0 {
		refreshToken, err := infra.IssueRefreshToken(opts.Username, policy.RefreshTokenLifetime)
		if err != nil {
			slog.Error("Failed to sign refresh token", "error", err)
			return httpx.InternalError(err, "无法创建刷新令牌")
		}
		attachRefreshToken(w, refreshToken, int(policy.RefreshTokenLifetime.Seconds()))
	}

	accessToken, err := infra.IssueAccessToken(infraOpts, policy.AccessTokenLifetime)
	if err != nil {
		slog.Error("Failed to sign access token", "error", err)
		return httpx.InternalError(err, "无法创建访问令牌")
	}
	render.PlainText(w, r, accessToken)
	return nil
}

func verifyRefreshToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(RefreshTokenCookieName)
	if err != nil {
		return "", httpx.Unauthorized("缺少刷新令牌")
	}

	username, err := infra.ParseRefreshToken(cookie.Value)
	if err != nil {
		return "", httpx.Unauthorized("无效的刷新令牌")
	}
	return username, nil
}

func respondLogout(w http.ResponseWriter, r *http.Request) error {
	attachRefreshToken(w, "", 0)
	render.PlainText(w, r, "")
	return nil
}

func attachRefreshToken(w http.ResponseWriter, token string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshTokenCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
