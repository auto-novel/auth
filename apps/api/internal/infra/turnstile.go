package infra

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// DefaultTurnstileEndpoint is Cloudflare's token validation endpoint.
const DefaultTurnstileEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// turnstileMaxTokenLength rejects oversized tokens before they reach Cloudflare.
const turnstileMaxTokenLength = 2048

var (
	// ErrTurnstileInvalid is returned when Cloudflare rejects the token, or when
	// the token was minted for another action or frontend hostname.
	ErrTurnstileInvalid = errors.New("turnstile token is invalid")
	// ErrTurnstileUnavailable is returned when the token could not be checked.
	ErrTurnstileUnavailable = errors.New("turnstile verification is unavailable")
)

// TurnstileVerifier validates Turnstile tokens against siteverify. The token is
// rejected unless Cloudflare returns success, an allowed frontend hostname, and
// the action it was minted for. This mirrors the canonical siteverify contract.
type TurnstileVerifier interface {
	Verify(ctx context.Context, token string, remoteIp string, expectedAction string) error
}

type turnstileVerifier struct {
	secret    string
	endpoint  string
	client    *http.Client
	hostnames map[string]struct{}
}

// TurnstileOption customises a Turnstile verifier.
type TurnstileOption func(*turnstileVerifier)

// WithTurnstileEndpoint overrides the siteverify URL. It exists so tests can
// point the verifier at a stub instead of Cloudflare.
func WithTurnstileEndpoint(endpoint string) TurnstileOption {
	return func(v *turnstileVerifier) {
		if endpoint != "" {
			v.endpoint = endpoint
		}
	}
}

func resolveTurnstileHostnames(hostnames []string) map[string]struct{} {
	resolved := make(map[string]struct{}, len(hostnames))
	for _, hostname := range hostnames {
		trimmed := strings.ToLower(strings.TrimSpace(hostname))
		if trimmed != "" {
			resolved[trimmed] = struct{}{}
		}
	}
	return resolved
}

// NewTurnstileVerifier creates a verifier. It always fails closed: a missing
// secret, an empty hostname allowlist, or an unreachable siteverify all reject
// the request rather than letting it through.
func NewTurnstileVerifier(secret string, hostnames []string, options ...TurnstileOption) TurnstileVerifier {
	verifier := &turnstileVerifier{
		secret:    secret,
		endpoint:  DefaultTurnstileEndpoint,
		client:    &http.Client{},
		hostnames: resolveTurnstileHostnames(hostnames),
	}
	for _, option := range options {
		option(verifier)
	}
	if verifier.secret == "" {
		slog.Warn("TURNSTILE_SECRET is not set, OTP requests will be rejected")
	}
	if len(verifier.hostnames) == 0 {
		slog.Warn("TURNSTILE_HOSTNAMES is not set, OTP requests will be rejected")
	}
	return verifier
}

type turnstileResponse struct {
	Success    bool     `json:"success"`
	Action     string   `json:"action"`
	Hostname   string   `json:"hostname"`
	ErrorCodes []string `json:"error-codes"`
}

func (v *turnstileVerifier) Verify(ctx context.Context, token string, remoteIp string, expectedAction string) error {
	if v.secret == "" || len(v.hostnames) == 0 {
		return ErrTurnstileUnavailable
	}
	if token == "" {
		return ErrTurnstileInvalid
	}
	if len(token) > turnstileMaxTokenLength {
		return fmt.Errorf("%w: token exceeds %d characters", ErrTurnstileInvalid, turnstileMaxTokenLength)
	}

	form := url.Values{}
	form.Set("secret", v.secret)
	form.Set("response", token)
	if remoteIp != "" {
		form.Set("remoteip", remoteIp)
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		v.endpoint,
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return fmt.Errorf("%w: build siteverify request: %w", ErrTurnstileUnavailable, err)
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := v.client.Do(request)
	if err != nil {
		return fmt.Errorf("%w: call siteverify: %w", ErrTurnstileUnavailable, err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("%w: siteverify returned status %d", ErrTurnstileUnavailable, response.StatusCode)
	}

	var result turnstileResponse
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return fmt.Errorf("%w: decode siteverify response: %w", ErrTurnstileUnavailable, err)
	}
	if !result.Success {
		for _, code := range result.ErrorCodes {
			switch code {
			case "internal-error", "missing-input-secret", "invalid-input-secret":
				return fmt.Errorf("%w: %s", ErrTurnstileUnavailable, strings.Join(result.ErrorCodes, ","))
			}
		}
		return fmt.Errorf("%w: %s", ErrTurnstileInvalid, strings.Join(result.ErrorCodes, ","))
	}
	if _, ok := v.hostnames[strings.ToLower(result.Hostname)]; !ok {
		return fmt.Errorf("%w: hostname %q is not allowed", ErrTurnstileInvalid, result.Hostname)
	}
	if result.Action != expectedAction {
		return fmt.Errorf("%w: action %q does not match %q", ErrTurnstileInvalid, result.Action, expectedAction)
	}
	return nil
}
