package repository

import (
	"auth/.gen/main/public/model"
	. "auth/.gen/main/public/table"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/go-jet/jet/v2/qrm"
)

const (
	SettingRegisterEnabled      = "register_enabled"
	SettingResetPasswordEnabled = "reset_password_enabled"
)

type AuthSettings struct {
	RegisterEnabled      bool      `json:"registerEnabled"`
	ResetPasswordEnabled bool      `json:"resetPasswordEnabled"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

type SettingRepository interface {
	Load() error
	Get() *AuthSettings
	Update(settings AuthSettings) (*AuthSettings, error)
}

type settingRepository struct {
	db       *sql.DB
	mu       sync.RWMutex
	settings AuthSettings
}

func NewSettingRepository(db *sql.DB) SettingRepository {
	return &settingRepository{
		db: db,
		settings: AuthSettings{
			RegisterEnabled:      true,
			ResetPasswordEnabled: true,
		},
	}
}

func decodeSettings(records []model.AuthSetting) (*AuthSettings, error) {
	settings := &AuthSettings{
		RegisterEnabled:      true,
		ResetPasswordEnabled: true,
	}
	for _, record := range records {
		var enabled bool
		if err := json.Unmarshal([]byte(record.Value), &enabled); err != nil {
			return nil, fmt.Errorf("decode setting %q: %w", record.Key, err)
		}
		switch record.Key {
		case SettingRegisterEnabled:
			settings.RegisterEnabled = enabled
		case SettingResetPasswordEnabled:
			settings.ResetPasswordEnabled = enabled
		}
		if record.UpdatedAt.After(settings.UpdatedAt) {
			settings.UpdatedAt = record.UpdatedAt
		}
	}
	return settings, nil
}

func (r *settingRepository) Load() error {
	stmt := SELECT(AuthSetting.AllColumns).
		FROM(AuthSetting).
		WHERE(AuthSetting.Key.IN(
			String(SettingRegisterEnabled),
			String(SettingResetPasswordEnabled),
		))

	var records []model.AuthSetting
	err := stmt.Query(r.db, &records)
	if err != nil && err != qrm.ErrNoRows {
		return err
	}
	settings, err := decodeSettings(records)
	if err != nil {
		return err
	}

	r.mu.Lock()
	r.settings = *settings
	r.mu.Unlock()
	return nil
}

func (r *settingRepository) Get() *AuthSettings {
	r.mu.RLock()
	settings := r.settings
	r.mu.RUnlock()
	return &settings
}

func (r *settingRepository) Update(settings AuthSettings) (*AuthSettings, error) {
	updatedAt := time.Now()
	values := []model.AuthSetting{
		{Key: SettingRegisterEnabled, UpdatedAt: updatedAt},
		{Key: SettingResetPasswordEnabled, UpdatedAt: updatedAt},
	}
	for i, enabled := range []bool{settings.RegisterEnabled, settings.ResetPasswordEnabled} {
		value, err := json.Marshal(enabled)
		if err != nil {
			return nil, err
		}
		values[i].Value = string(value)
	}
	stmt := AuthSetting.
		INSERT(AuthSetting.AllColumns).
		MODELS(values).
		ON_CONFLICT(AuthSetting.Key).
		DO_UPDATE(SET(
			AuthSetting.Value.SET(AuthSetting.EXCLUDED.Value),
			AuthSetting.UpdatedAt.SET(AuthSetting.EXCLUDED.UpdatedAt),
		))

	r.mu.Lock()
	defer r.mu.Unlock()
	if _, err := stmt.Exec(r.db); err != nil {
		return nil, err
	}
	settings.UpdatedAt = updatedAt
	r.settings = settings
	updated := r.settings
	return &updated, nil
}
