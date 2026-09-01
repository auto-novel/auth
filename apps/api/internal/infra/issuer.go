package infra

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	RefreshTokenSecret string
	AccessTokenSecret  string
)

const (
	AppAuth   = "auth"
	AppN      = "n"
	AppF      = "f"
	AppLegado = "legado"
)

type TokenPolicy struct {
	RefreshTokenLifetime time.Duration
	AccessTokenLifetime  time.Duration
}

var tokenPolicies = map[string]TokenPolicy{
	AppAuth: {
		RefreshTokenLifetime: time.Hour * 24 * 100,
		AccessTokenLifetime:  time.Hour * 2,
	},
	AppN: {
		RefreshTokenLifetime: time.Hour * 24 * 100,
		AccessTokenLifetime:  time.Hour * 2,
	},
	AppF: {
		RefreshTokenLifetime: time.Hour * 24 * 100,
		AccessTokenLifetime:  time.Hour * 2,
	},
	AppLegado: {
		RefreshTokenLifetime: 0,
		AccessTokenLifetime:  time.Hour * 24 * 100,
	},
}

func TokenPolicyForApp(app string) (TokenPolicy, bool) {
	policy, ok := tokenPolicies[app]
	return policy, ok
}

type accessClaim struct {
	jwt.RegisteredClaims
	UserID    int64            `json:"uid"`
	Role      string           `json:"role"`
	CreatedAt *jwt.NumericDate `json:"crat"`
}

type refreshClaim struct {
	jwt.RegisteredClaims
}

type TokenOptions struct {
	App       string
	UserID    int64
	Username  string
	Role      string
	CreatedAt time.Time
}

func IssueAccessToken(opts TokenOptions, lifetime time.Duration) (string, error) {
	issuedAt := time.Now()
	claims := accessClaim{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   opts.Username,
			Audience:  jwt.ClaimStrings{opts.App},
			ExpiresAt: jwt.NewNumericDate(issuedAt.Add(lifetime)),
			IssuedAt:  jwt.NewNumericDate(issuedAt),
		},
		UserID:    opts.UserID,
		Role:      opts.Role,
		CreatedAt: jwt.NewNumericDate(opts.CreatedAt),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(AccessTokenSecret))
}

func IssueRefreshToken(username string, lifetime time.Duration) (string, error) {
	issuedAt := time.Now()
	claims := refreshClaim{RegisteredClaims: jwt.RegisteredClaims{
		Subject:   username,
		ExpiresAt: jwt.NewNumericDate(issuedAt.Add(lifetime)),
		IssuedAt:  jwt.NewNumericDate(issuedAt),
	}}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(RefreshTokenSecret))
}

func ParseRefreshToken(tokenString string) (string, error) {
	claims := &refreshClaim{}
	token, err := jwt.ParseWithClaims(tokenString, claims,
		func(token *jwt.Token) (interface{}, error) {
			return []byte(RefreshTokenSecret), nil
		},
	)
	if err != nil || !token.Valid {
		return "", err
	}

	validClaims, ok := token.Claims.(*refreshClaim)
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}
	return validClaims.Subject, nil
}
