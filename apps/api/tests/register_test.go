//go:build integration

package tests

import (
	"auth/internal/authn"
	"auth/internal/repository"
	"crypto/sha256"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type reqRegister struct {
	App      string `json:"app"`
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Otp      string `json:"otp"`
}

func TestAuthRegisterBadRequestCases(t *testing.T) {
	baseReq := reqRegister{
		App:      "App",
		Username: "User",
		Password: "Password123!",
		Email:    "test@example.com",
		Otp:      "123456",
	}
	cases := []struct {
		name    string
		modify  func(*reqRegister)
		message string
	}{
		{
			name:    "InvalidEmail",
			modify:  func(r *reqRegister) { r.Email = "not-an-email" },
			message: "邮箱必须是有效的邮箱地址",
		},
		{
			name:    "ShortUsername",
			modify:  func(r *reqRegister) { r.Username = "a" },
			message: "用户名至少需要2个字符",
		},
		{
			name:    "ShortUsernameUnicode",
			modify:  func(r *reqRegister) { r.Username = "你" },
			message: "用户名至少需要2个字符",
		},
		{
			name:    "LongUsername",
			modify:  func(r *reqRegister) { r.Username = strings.Repeat("a", 17) },
			message: "用户名不能超过16个字符",
		},
		{
			name:    "UsernameWithLeadingSpace",
			modify:  func(r *reqRegister) { r.Username = " User" },
			message: "用户名前后不能有空格",
		},
		{
			name:    "UsernameWithControlCharacter",
			modify:  func(r *reqRegister) { r.Username = "U\nser" },
			message: "用户名只能包含可打印字符",
		},
		{
			name:    "ShortPassword",
			modify:  func(r *reqRegister) { r.Password = "short" },
			message: "密码至少需要8个字符",
		},
		{
			name:    "LongPassword",
			modify:  func(r *reqRegister) { r.Password = strings.Repeat("a", 101) },
			message: "密码不能超过100个字符",
		},
		{
			name:    "InvalidVerifyOtp",
			modify:  func(r *reqRegister) { r.Otp = "abcdef" },
			message: "验证码必须是数字",
		},
		{
			name:    "ShortOtp",
			modify:  func(r *reqRegister) { r.Otp = "123" },
			message: "验证码长度必须为6位",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			req := baseReq
			tc.modify(&req)
			SendRequestAndExpectError(
				t, http.MethodPost, "/v1/auth/register", req,
				http.StatusBadRequest, tc.message,
			)
		})
	}
}

func TestAuthRegisterSuccess(t *testing.T) {
	resetDatabase(t)

	req := reqRegister{
		App:      authn.AppAuth,
		Username: "new-user",
		Password: "Password123!",
		Email:    "new-user@example.com",
	}
	req.Otp = prepareOtp(t, req.Email)

	resp, body := sendRegister(t, req)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, resp.StatusCode, body)
	}

	token, err := jwt.Parse(
		body,
		func(token *jwt.Token) (any, error) {
			return []byte(testAccessTokenSecret), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithAudience(req.App),
		jwt.WithSubject(req.Username),
	)
	if err != nil || !token.Valid {
		t.Fatalf("invalid access token: %v", err)
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["role"] != repository.RoleMember {
		t.Fatalf("expected member role, got %#v", claims["role"])
	}

	refreshCookie := findCookie(resp, authn.RefreshTokenCookieName)
	if refreshCookie == nil {
		t.Fatal("expected refresh token cookie")
	}
	if !refreshCookie.HttpOnly || !refreshCookie.Secure || refreshCookie.SameSite != http.SameSiteStrictMode {
		t.Fatalf("unexpected refresh cookie attributes: %#v", refreshCookie)
	}

	user, err := userRepo.FindByUsername(req.Username)
	if err != nil {
		t.Fatalf("find registered user: %v", err)
	}
	if user == nil {
		t.Fatal("registered user was not persisted")
	}
	if claims["uid"] != float64(user.ID) {
		t.Fatalf("expected user ID %d, got %#v", user.ID, claims["uid"])
	}
	if user.Email != req.Email || user.Role != repository.RoleMember {
		t.Fatalf("unexpected registered user: %#v", user)
	}
	if user.Password == req.Password {
		t.Fatal("password was stored in plaintext")
	}
	var otpCount int
	if err := testDB.QueryRow(
		"SELECT count(*) FROM auth_otp WHERE email = $1 AND type = $2",
		req.Email,
		repository.OtpVerify,
	).Scan(&otpCount); err != nil {
		t.Fatalf("count OTP records: %v", err)
	}
	if otpCount != 0 {
		t.Fatalf("expected successful OTP to be consumed, found %d records", otpCount)
	}
	validation, err := authn.ValidateHash(user.Password, req.Password)
	if err != nil || !validation.Valid {
		t.Fatalf("stored password hash does not validate: %v", err)
	}

	var action string
	var detailJSON []byte
	err = testDB.QueryRow(`
		SELECT action, detail
		FROM auth_event
		WHERE action = 'register'
		ORDER BY id DESC
		LIMIT 1
	`).Scan(&action, &detailJSON)
	if err != nil {
		t.Fatalf("find register event: %v", err)
	}
	var detail map[string]string
	if err := json.Unmarshal(detailJSON, &detail); err != nil {
		t.Fatalf("decode register event: %v", err)
	}
	if action != "register" ||
		detail["app"] != req.App ||
		detail["actor_user"] != req.Username ||
		detail["target_user"] != req.Username ||
		detail["ip"] != "192.0.2.1" {
		t.Fatalf("unexpected register event: action=%q detail=%#v", action, detail)
	}
}

func TestAuthRegisterRejectsInvalidOtp(t *testing.T) {
	cases := []struct {
		name  string
		setup func(t *testing.T, req *reqRegister)
	}{
		{name: "Missing"},
		{
			name: "WrongCode",
			setup: func(t *testing.T, req *reqRegister) {
				prepareOtp(t, req.Email)
			},
		},
		{
			name: "OtherEmail",
			setup: func(t *testing.T, req *reqRegister) {
				req.Otp = prepareOtp(t, "other@example.com")
			},
		},
		{
			name: "Expired",
			setup: func(t *testing.T, req *reqRegister) {
				insertOtp(t, repository.OtpVerify, req.Email, req.Otp, time.Now().Add(-time.Minute))
			},
		},
		{
			name: "WrongType",
			setup: func(t *testing.T, req *reqRegister) {
				insertOtp(t, repository.OtpResetPassword, req.Email, req.Otp, time.Now().Add(time.Minute))
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resetDatabase(t)
			req := reqRegister{
				App:      authn.AppAuth,
				Username: "otp-user",
				Password: "Password123!",
				Email:    "otp-user@example.com",
				Otp:      "123456",
			}
			if tc.setup != nil {
				tc.setup(t, &req)
			}

			SendRequestAndExpectError(
				t, http.MethodPost, "/v1/auth/register", req,
				http.StatusBadRequest, "无效验证码",
			)
			user, err := userRepo.FindByUsername(req.Username)
			if err != nil {
				t.Fatalf("find user after rejected registration: %v", err)
			}
			if user != nil {
				t.Fatal("invalid OTP registration persisted a user")
			}
		})
	}
}

func TestAuthRegisterConflicts(t *testing.T) {
	resetDatabase(t)

	first := reqRegister{
		App:      authn.AppAuth,
		Username: "existing-user",
		Password: "Password123!",
		Email:    "existing@example.com",
	}
	first.Otp = prepareOtp(t, first.Email)
	resp, body := sendRegister(t, first)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("seed registration failed with status %d: %s", resp.StatusCode, body)
	}

	t.Run("Username", func(t *testing.T) {
		req := first
		req.Email = "different@example.com"
		req.Otp = prepareOtp(t, req.Email)
		SendRequestAndExpectError(
			t, http.MethodPost, "/v1/auth/register", req,
			http.StatusConflict, "用户名已被占用",
		)
		assertOtpExists(t, req.Email, repository.OtpVerify)
	})

	t.Run("Email", func(t *testing.T) {
		req := first
		req.Username = "different-user"
		req.Otp = prepareOtp(t, req.Email)
		SendRequestAndExpectError(
			t, http.MethodPost, "/v1/auth/register", req,
			http.StatusConflict, "邮箱已被占用",
		)
		assertOtpExists(t, req.Email, repository.OtpVerify)
	})
}

func assertOtpExists(t *testing.T, email, otpType string) {
	t.Helper()
	var count int
	if err := testDB.QueryRow(
		"SELECT count(*) FROM auth_otp WHERE email = $1 AND type = $2",
		email,
		otpType,
	).Scan(&count); err != nil {
		t.Fatalf("count OTP records: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected OTP to remain usable after failed operation, found %d records", count)
	}
}

func prepareOtp(t *testing.T, email string) string {
	t.Helper()
	otp, err := otpRepo.SetOtp(repository.OtpVerify, email)
	if err != nil {
		t.Fatalf("prepare OTP: %v", err)
	}
	return otp
}

func insertOtp(t *testing.T, otpType, email, otp string, expiresAt time.Time) {
	t.Helper()
	hash := sha256.Sum256([]byte(otp))
	_, err := testDB.Exec(`
		INSERT INTO auth_otp (email, type, code_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`, email, otpType, hash[:], expiresAt)
	if err != nil {
		t.Fatalf("insert OTP: %v", err)
	}
}

func sendRegister(t *testing.T, body reqRegister) (*http.Response, string) {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("encode request: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, Url+"/v1/auth/register", strings.NewReader(string(b)))
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Real-Ip", "192.0.2.1")
	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("send request: %v", err)
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read response: %v", err)
	}
	return resp, string(responseBody)
}

func findCookie(resp *http.Response, name string) *http.Cookie {
	for _, cookie := range resp.Cookies() {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}
