//go:build integration

package tests

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"testing"
)

var (
	Url    string
	Client *http.Client
)

func SendRequestAndExpectError[T any](
	t *testing.T,
	method, url string, body T,
	expectedStatus int, expectedMessage string,
) error {
	b, _ := json.Marshal(body)
	req, err := http.NewRequest(method, Url+url, bytes.NewReader(b))
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Real-Ip", "192.0.2.1")

	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Errorf("failed to read response body: %v", err)
	}
	bodyString := string(bodyBytes)

	if resp.StatusCode != expectedStatus {
		t.Errorf("expected status %d, got %d", expectedStatus, resp.StatusCode)
	}
	if expectedMessage != "" && bodyString != expectedMessage {
		t.Errorf("expected message '%s', got '%s'", expectedMessage, bodyString)
	}
	return nil
}
