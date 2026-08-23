package service

import (
	"auth/internal/repository"
	"auth/internal/util"
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

type settingRepositoryStub struct {
	settings repository.AuthSettings
}

func (s settingRepositoryStub) Load() error { return nil }

func (s settingRepositoryStub) Get() *repository.AuthSettings {
	settings := s.settings
	return &settings
}

func (s settingRepositoryStub) Update(settings repository.AuthSettings) (*repository.AuthSettings, error) {
	return &settings, nil
}

func TestAuthFeaturesCanBeDisabled(t *testing.T) {
	service := &authService{settingRepo: settingRepositoryStub{}}
	tests := []struct {
		name    string
		path    string
		body    string
		handler func(http.ResponseWriter, *http.Request) error
		message string
	}{
		{
			name:    "register",
			path:    "/register",
			body:    `{}`,
			handler: service.Register,
			message: "注册功能已关闭",
		},
		{
			name:    "register OTP",
			path:    "/otp/request",
			body:    `{"email":"new@example.com","type":"verify"}`,
			handler: service.RequestOtp,
			message: "注册功能已关闭",
		},
		{
			name:    "reset password",
			path:    "/password/reset",
			body:    `{}`,
			handler: service.ResetPassword,
			message: "重置密码功能已关闭",
		},
		{
			name:    "reset password OTP",
			path:    "/otp/request",
			body:    `{"email":"user@example.com","type":"reset_password"}`,
			handler: service.RequestOtp,
			message: "重置密码功能已关闭",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, test.path, bytes.NewBufferString(test.body))
			request.Header.Set("Content-Type", "application/json")
			response := httptest.NewRecorder()

			util.EH(test.handler).ServeHTTP(response, request)

			result := response.Result()
			defer result.Body.Close()
			body, err := io.ReadAll(result.Body)
			if err != nil {
				t.Fatalf("read response: %v", err)
			}
			if result.StatusCode != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d", http.StatusForbidden, result.StatusCode)
			}
			if string(body) != test.message {
				t.Fatalf("expected message %q, got %q", test.message, string(body))
			}
		})
	}
}
