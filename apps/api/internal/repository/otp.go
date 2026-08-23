package repository

import (
	"auth/.gen/main/public/model"
	. "auth/.gen/main/public/table"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"math/big"
	"time"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/go-jet/jet/v2/qrm"
)

const (
	OtpVerify        string = "verify"
	OtpResetPassword string = "reset_password"
)

type OtpRepository interface {
	SetOtp(otpType string, email string) (string, error)
	CheckOtp(otpType string, email string, otp string) (bool, error)
	DeleteOtp(otpType string, email string, otp string) error
	DeleteExpiredOtps() (int64, error)
}

type Otp = model.AuthOtp

type otpRepository struct {
	db *sql.DB
}

func NewOtpRepository(db *sql.DB) OtpRepository {
	return &otpRepository{db: db}
}

func createOtp(otpType string) (string, error) {
	switch otpType {
	case OtpVerify:
		n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("%06d", n.Int64()), nil
	case OtpResetPassword:
		return rand.Text(), nil
	default:
		return "", fmt.Errorf("unknown otp type: %s", otpType)
	}
}

func (r *otpRepository) SetOtp(otpType string, email string) (string, error) {
	otp, err := createOtp(otpType)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256([]byte(otp))
	now := time.Now()
	record := &Otp{
		Email:     email,
		Type:      otpType,
		CodeHash:  hash[:],
		ExpiresAt: now.Add(15 * time.Minute),
		CreatedAt: now,
	}
	stmt := AuthOtp.
		INSERT(AuthOtp.AllColumns).
		MODEL(record).
		ON_CONFLICT(AuthOtp.Email, AuthOtp.Type).
		DO_UPDATE(SET(
			AuthOtp.CodeHash.SET(AuthOtp.EXCLUDED.CodeHash),
			AuthOtp.ExpiresAt.SET(AuthOtp.EXCLUDED.ExpiresAt),
			AuthOtp.CreatedAt.SET(AuthOtp.EXCLUDED.CreatedAt),
		))

	_, err = stmt.Exec(r.db)
	if err != nil {
		return "", err
	}
	return otp, nil
}

func (r *otpRepository) CheckOtp(otpType string, email, otp string) (bool, error) {
	hash := sha256.Sum256([]byte(otp))
	stmt := SELECT(AuthOtp.Email).
		FROM(AuthOtp).
		WHERE(AND(
			AuthOtp.Email.EQ(String(email)),
			AuthOtp.Type.EQ(String(otpType)),
			AuthOtp.CodeHash.EQ(Bytea(hash[:])),
			AuthOtp.ExpiresAt.GT(CURRENT_TIMESTAMP()),
		))

	var matched struct {
		Email string
	}
	err := stmt.Query(r.db, &matched)
	if err == qrm.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *otpRepository) DeleteOtp(otpType string, email, otp string) error {
	hash := sha256.Sum256([]byte(otp))
	stmt := AuthOtp.
		DELETE().
		WHERE(AND(
			AuthOtp.Email.EQ(String(email)),
			AuthOtp.Type.EQ(String(otpType)),
			AuthOtp.CodeHash.EQ(Bytea(hash[:])),
		))

	_, err := stmt.Exec(r.db)
	return err
}

func (r *otpRepository) DeleteExpiredOtps() (int64, error) {
	result, err := AuthOtp.
		DELETE().
		WHERE(AuthOtp.ExpiresAt.LT_EQ(CURRENT_TIMESTAMP())).
		Exec(r.db)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}
