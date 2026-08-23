//go:build integration

package tests

import (
	"auth/internal/repository"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"testing"
)

func TestAdminAuthSetting(t *testing.T) {
	resetDatabase(t)
	if _, err := testDB.Exec(`
		INSERT INTO auth_setting (key, value)
		VALUES ('future_setting', '{"enabled":true}'::jsonb)
	`); err != nil {
		t.Fatalf("insert future setting: %v", err)
	}

	updated := updateAdminSetting(t, false, false)
	if updated.RegisterEnabled || updated.ResetPasswordEnabled {
		t.Fatalf("unexpected updated settings: %#v", updated)
	}

	req, err := http.NewRequest(http.MethodGet, Url+"/v1/admin/setting", nil)
	if err != nil {
		t.Fatalf("create setting request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+adminAccessToken(t))
	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("get settings: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected status 200, got %d: %s", resp.StatusCode, body)
	}
	var current repository.AuthSettings
	if err := json.NewDecoder(resp.Body).Decode(&current); err != nil {
		t.Fatalf("decode settings: %v", err)
	}
	if current.RegisterEnabled || current.ResetPasswordEnabled {
		t.Fatalf("unexpected current settings: %#v", current)
	}

	var futureSetting string
	if err := testDB.QueryRow(`
		SELECT value::text
		FROM auth_setting
		WHERE key = 'future_setting'
	`).Scan(&futureSetting); err != nil {
		t.Fatalf("find future setting after settings update: %v", err)
	}
	if futureSetting != `{"enabled": true}` {
		t.Fatalf("future setting was changed: %s", futureSetting)
	}

	SendRequestAndExpectError(
		t, http.MethodPost, "/v1/auth/register", map[string]string{},
		http.StatusForbidden, "注册功能已关闭",
	)
	SendRequestAndExpectError(
		t, http.MethodPost, "/v1/auth/otp/request", map[string]string{
			"email": "new@example.com",
			"type":  repository.OtpVerify,
		},
		http.StatusForbidden, "注册功能已关闭",
	)
	SendRequestAndExpectError(
		t, http.MethodPost, "/v1/auth/password/reset", map[string]string{},
		http.StatusForbidden, "重置密码功能已关闭",
	)
	SendRequestAndExpectError(
		t, http.MethodPost, "/v1/auth/otp/request", map[string]string{
			"email": "user@example.com",
			"type":  repository.OtpResetPassword,
		},
		http.StatusForbidden, "重置密码功能已关闭",
	)
}

func TestAdminAuthSettingUsesBusinessDefaults(t *testing.T) {
	resetDatabase(t)
	if _, err := testDB.Exec(`
		DELETE FROM auth_setting
		WHERE key IN ($1, $2)
	`, repository.SettingRegisterEnabled, repository.SettingResetPasswordEnabled); err != nil {
		t.Fatalf("delete auth settings: %v", err)
	}

	if err := settingRepo.Load(); err != nil {
		t.Fatalf("load default auth settings: %v", err)
	}
	settings := settingRepo.Get()
	if !settings.RegisterEnabled || !settings.ResetPasswordEnabled {
		t.Fatalf("unexpected default auth settings: %#v", settings)
	}

	updated := updateAdminSetting(t, false, true)
	if updated.RegisterEnabled || !updated.ResetPasswordEnabled {
		t.Fatalf("unexpected settings after first update: %#v", updated)
	}
}

func TestAuthSettingRepositoryCachesLoadedValues(t *testing.T) {
	resetDatabase(t)
	if _, err := settingRepo.Update(repository.AuthSettings{
		RegisterEnabled:      false,
		ResetPasswordEnabled: false,
	}); err != nil {
		t.Fatalf("update cached settings: %v", err)
	}
	if _, err := testDB.Exec(`
		UPDATE auth_setting
		SET value = 'true'::jsonb
		WHERE key = $1
	`, repository.SettingRegisterEnabled); err != nil {
		t.Fatalf("update setting outside repository: %v", err)
	}

	cached := settingRepo.Get()
	if cached.RegisterEnabled || cached.ResetPasswordEnabled {
		t.Fatalf("database change unexpectedly bypassed cache: %#v", cached)
	}

	if err := settingRepo.Load(); err != nil {
		t.Fatalf("reload auth settings: %v", err)
	}
	loaded := settingRepo.Get()
	if !loaded.RegisterEnabled || loaded.ResetPasswordEnabled {
		t.Fatalf("unexpected settings after reload: %#v", loaded)
	}
}

func updateAdminSetting(t *testing.T, registerEnabled, resetPasswordEnabled bool) repository.AuthSettings {
	t.Helper()
	body, err := json.Marshal(map[string]bool{
		"registerEnabled":      registerEnabled,
		"resetPasswordEnabled": resetPasswordEnabled,
	})
	if err != nil {
		t.Fatalf("encode settings: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, Url+"/v1/admin/setting", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("create setting update request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+adminAccessToken(t))
	req.Header.Set("Content-Type", "application/json")
	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("update settings: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		responseBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected status 200, got %d: %s", resp.StatusCode, responseBody)
	}
	var settings repository.AuthSettings
	if err := json.NewDecoder(resp.Body).Decode(&settings); err != nil {
		t.Fatalf("decode updated settings: %v", err)
	}
	return settings
}
