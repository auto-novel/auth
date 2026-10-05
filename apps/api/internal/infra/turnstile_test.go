package infra

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const (
	testHostname = "n.novelia.cc"
	testAction   = "signup"
)

// siteverifyStub records the received form and replies with the given body.
func siteverifyStub(t *testing.T, status int, body string) (*httptest.Server, *map[string]string) {
	t.Helper()
	received := &map[string]string{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			t.Errorf("parse form: %v", err)
		}
		values := map[string]string{}
		for key := range r.PostForm {
			values[key] = r.PostForm.Get(key)
		}
		*received = values
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		if _, err := io.WriteString(w, body); err != nil {
			t.Errorf("write response: %v", err)
		}
	}))
	t.Cleanup(server.Close)
	return server, received
}

// successBody is the siteverify reply for a token minted by an allowed frontend.
func successBody(hostname string, action string) string {
	return `{"success":true,"hostname":"` + hostname + `","action":"` + action + `"}`
}

func newTestVerifier(secret string, endpoint string, hostnames ...string) TurnstileVerifier {
	if hostnames == nil {
		hostnames = []string{testHostname}
	}
	return NewTurnstileVerifier(
		secret,
		hostnames,
		WithTurnstileEndpoint(endpoint),
	)
}

func TestTurnstileVerifySuccess(t *testing.T) {
	server, received := siteverifyStub(t, http.StatusOK, successBody(testHostname, testAction))
	verifier := newTestVerifier("secret", server.URL)

	if err := verifier.Verify(t.Context(), "token-abc", "192.0.2.10", testAction); err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if (*received)["secret"] != "secret" {
		t.Fatalf("expected secret to be sent, got %q", (*received)["secret"])
	}
	if (*received)["response"] != "token-abc" {
		t.Fatalf("expected response token to be sent, got %q", (*received)["response"])
	}
	if (*received)["remoteip"] != "192.0.2.10" {
		t.Fatalf("expected remoteip to be sent, got %q", (*received)["remoteip"])
	}
}

func TestTurnstileVerifyOmitsEmptyRemoteIp(t *testing.T) {
	server, received := siteverifyStub(t, http.StatusOK, successBody(testHostname, testAction))
	verifier := newTestVerifier("secret", server.URL)

	if err := verifier.Verify(t.Context(), "token-abc", "", testAction); err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if _, ok := (*received)["remoteip"]; ok {
		t.Fatal("expected remoteip to be omitted when empty")
	}
}

func TestTurnstileVerifyRejectsInvalidToken(t *testing.T) {
	server, _ := siteverifyStub(t, http.StatusOK, `{"success":false,"error-codes":["invalid-input-response"]}`)
	verifier := newTestVerifier("secret", server.URL)

	err := verifier.Verify(t.Context(), "bad-token", "", testAction)
	if !errors.Is(err, ErrTurnstileInvalid) {
		t.Fatalf("expected ErrTurnstileInvalid, got %v", err)
	}
}

func TestTurnstileVerifyRejectsForeignAction(t *testing.T) {
	// A token minted for another surface on the same widget must not be replayed.
	server, _ := siteverifyStub(t, http.StatusOK, successBody(testHostname, "contact"))
	verifier := newTestVerifier("secret", server.URL)

	err := verifier.Verify(t.Context(), "token-abc", "", testAction)
	if !errors.Is(err, ErrTurnstileInvalid) {
		t.Fatalf("expected ErrTurnstileInvalid, got %v", err)
	}
	if err == nil || !strings.Contains(err.Error(), "action") {
		t.Fatalf("expected the action to be named in the error, got %v", err)
	}
}

func TestTurnstileVerifyRejectsForeignHostname(t *testing.T) {
	// A token minted on another domain that also hosts this widget is rejected.
	server, _ := siteverifyStub(t, http.StatusOK, successBody("evil.example.com", testAction))
	verifier := newTestVerifier("secret", server.URL)

	err := verifier.Verify(t.Context(), "token-abc", "", testAction)
	if !errors.Is(err, ErrTurnstileInvalid) {
		t.Fatalf("expected ErrTurnstileInvalid, got %v", err)
	}
	if err == nil || !strings.Contains(err.Error(), "hostname") {
		t.Fatalf("expected the hostname to be named in the error, got %v", err)
	}
}

func TestTurnstileVerifyMatchesHostnameCaseInsensitively(t *testing.T) {
	server, _ := siteverifyStub(t, http.StatusOK, successBody("N.Novelia.CC", testAction))
	verifier := newTestVerifier("secret", server.URL, "n.novelia.cc")

	if err := verifier.Verify(t.Context(), "token-abc", "", testAction); err != nil {
		t.Fatalf("expected a case-insensitive hostname match, got %v", err)
	}
}

func TestTurnstileVerifyRejectsEmptyTokenWithoutCallingCloudflare(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()

	verifier := newTestVerifier("secret", server.URL)

	err := verifier.Verify(t.Context(), "", "", testAction)
	if !errors.Is(err, ErrTurnstileInvalid) {
		t.Fatalf("expected ErrTurnstileInvalid, got %v", err)
	}
	if called {
		t.Fatal("expected siteverify not to be called for an empty token")
	}
}

func TestTurnstileVerifyRejectsOversizedTokenWithoutCallingCloudflare(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()

	verifier := newTestVerifier("secret", server.URL)

	err := verifier.Verify(t.Context(), strings.Repeat("a", turnstileMaxTokenLength+1), "", testAction)
	if !errors.Is(err, ErrTurnstileInvalid) {
		t.Fatalf("expected ErrTurnstileInvalid, got %v", err)
	}
	if called {
		t.Fatal("expected siteverify not to be called for an oversized token")
	}
}

func TestTurnstileVerifyFailsClosed(t *testing.T) {
	unreachable := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	unreachableUrl := unreachable.URL
	unreachable.Close()

	tests := []struct {
		name     string
		secret   string
		endpoint func(t *testing.T) string
		hostname []string
		token    string
	}{
		{
			name:     "missing secret",
			secret:   "",
			endpoint: func(t *testing.T) string { return "http://127.0.0.1:1" },
			token:    "token",
		},
		{
			name:     "missing hostname allowlist",
			secret:   "secret",
			endpoint: func(t *testing.T) string { return "http://127.0.0.1:1" },
			hostname: []string{},
			token:    "token",
		},
		{
			name:     "blank hostname allowlist",
			secret:   "secret",
			endpoint: func(t *testing.T) string { return "http://127.0.0.1:1" },
			hostname: []string{"  ", ""},
			token:    "token",
		},
		{
			name:     "endpoint unreachable",
			secret:   "secret",
			endpoint: func(t *testing.T) string { return unreachableUrl },
			token:    "token",
		},
		{
			name:   "unexpected status",
			secret: "secret",
			endpoint: func(t *testing.T) string {
				server, _ := siteverifyStub(t, http.StatusInternalServerError, `{}`)
				return server.URL
			},
			token: "token",
		},
		{
			name:   "malformed body",
			secret: "secret",
			endpoint: func(t *testing.T) string {
				server, _ := siteverifyStub(t, http.StatusOK, `not json`)
				return server.URL
			},
			token: "token",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			verifier := newTestVerifier(test.secret, test.endpoint(t), test.hostname...)

			err := verifier.Verify(t.Context(), test.token, "", testAction)
			if !errors.Is(err, ErrTurnstileUnavailable) {
				t.Fatalf("expected ErrTurnstileUnavailable, got %v", err)
			}
		})
	}
}
