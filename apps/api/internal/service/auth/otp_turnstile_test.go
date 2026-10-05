package auth

import (
	"auth/internal/httpx"
	"auth/internal/infra"
	"auth/internal/repository"
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

type turnstileVerifierStub struct {
	err     error
	tokens  []string
	ips     []string
	actions []string
}

func (s *turnstileVerifierStub) Verify(_ context.Context, token string, remoteIp string, expectedAction string) error {
	s.tokens = append(s.tokens, token)
	s.ips = append(s.ips, remoteIp)
	s.actions = append(s.actions, expectedAction)
	return s.err
}

func newOtpRequestService(verifier infra.TurnstileVerifier, settings repository.AuthSettings) *authService {
	return &authService{
		settingRepo: settingRepositoryStub{settings: settings},
		turnstile:   verifier,
	}
}

func TestRequestOtpRequiresTurnstile(t *testing.T) {
	settings := repository.AuthSettings{RegisterEnabled: true, ResetPasswordEnabled: true}
	tests := []struct {
		name       string
		verifier   infra.TurnstileVerifier
		body       string
		wantStatus int
		wantBody   string
	}{
		{
			name:       "missing token",
			verifier:   &turnstileVerifierStub{},
			body:       `{"email":"new@example.com","type":"verify"}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   "人机验证令牌为必填字段",
		},
		{
			name:       "rejected token",
			verifier:   &turnstileVerifierStub{err: infra.ErrTurnstileInvalid},
			body:       `{"email":"new@example.com","type":"verify","turnstileToken":"bad"}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   "人机验证失败，请重试",
		},
		{
			name: "siteverify unavailable",
			verifier: &turnstileVerifierStub{
				err: infra.ErrTurnstileUnavailable,
			},
			body:       `{"email":"new@example.com","type":"reset_password","turnstileToken":"token"}`,
			wantStatus: http.StatusServiceUnavailable,
			wantBody:   "人机验证服务暂不可用，请稍后再试",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := newOtpRequestService(test.verifier, settings)

			request := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(test.body))
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("X-Real-Ip", "192.0.2.10")
			response := httptest.NewRecorder()

			httpx.EH(service.RequestOtp).ServeHTTP(response, request)

			result := response.Result()
			defer result.Body.Close()
			body, err := io.ReadAll(result.Body)
			if err != nil {
				t.Fatalf("read response: %v", err)
			}
			if result.StatusCode != test.wantStatus {
				t.Fatalf("expected status %d, got %d", test.wantStatus, result.StatusCode)
			}
			if string(body) != test.wantBody {
				t.Fatalf("expected body %q, got %q", test.wantBody, string(body))
			}
		})
	}
}

func TestRequestOtpPassesTurnstileParameters(t *testing.T) {
	tests := []struct {
		otpType string
		action  string
	}{
		{otpType: repository.OtpVerify, action: TurnstileActionSignup},
		{otpType: repository.OtpResetPassword, action: TurnstileActionPasswordReset},
	}

	for _, test := range tests {
		t.Run(test.otpType, func(t *testing.T) {
			// The verifier reports failure, so the request never reaches the repos.
			verifier := &turnstileVerifierStub{err: infra.ErrTurnstileInvalid}
			service := newOtpRequestService(verifier, repository.AuthSettings{
				RegisterEnabled:      true,
				ResetPasswordEnabled: true,
			})

			request := httptest.NewRequest(
				http.MethodPost,
				"/otp/request",
				bytes.NewBufferString(
					`{"email":"user@example.com","type":"`+test.otpType+`","turnstileToken":"token"}`,
				),
			)
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("X-Real-Ip", "192.0.2.10")
			response := httptest.NewRecorder()

			httpx.EH(service.RequestOtp).ServeHTTP(response, request)

			if len(verifier.tokens) != 1 || verifier.tokens[0] != "token" {
				t.Fatalf("expected token %q, got %v", "token", verifier.tokens)
			}
			if len(verifier.ips) != 1 || verifier.ips[0] != "192.0.2.10" {
				t.Fatalf("expected remote ip %q, got %v", "192.0.2.10", verifier.ips)
			}
			if len(verifier.actions) != 1 || verifier.actions[0] != test.action {
				t.Fatalf("expected action %q, got %v", test.action, verifier.actions)
			}
			if response.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d", http.StatusBadRequest, response.Code)
			}
		})
	}
}
