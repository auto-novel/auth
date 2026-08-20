package util

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

type VerifyResult struct {
	Valid    bool // 密码是否匹配
	Obsolete bool // 哈希是否过时
}

const (
	PBKDF2_KeySize    = sha256.Size
	PBKDF2_Iterations = 120000
	PBKDF2_SaltSize   = 16
)

func GenerateHash(password string) (string, error) {

	salt := make([]byte, PBKDF2_SaltSize)
	_, err := rand.Read(salt)
	if err != nil {
		return "", err
	}

	hash, err := pbkdf2.Key(sha512.New, password, salt, PBKDF2_Iterations, PBKDF2_KeySize)
	if err != nil {
		return "", err
	}

	encodedSalt := base64.RawStdEncoding.EncodeToString(salt)
	encodedHash := base64.RawStdEncoding.EncodeToString(hash)

	hashStr := fmt.Sprintf("$pbkdf2-sha512$%d.%d$%s$%s",
		PBKDF2_KeySize,
		PBKDF2_Iterations,
		encodedSalt,
		encodedHash,
	)
	return hashStr, nil
}

func ValidateHash(hashedPassword, password string) (VerifyResult, error) {
	switch {
	case strings.HasPrefix(hashedPassword, "$pbkdf2-sha512$"):
		return validatePbkdf2(hashedPassword, password)
	default:
		return VerifyResult{}, errors.New("unsupported hash format")
	}
}

func validatePbkdf2(hashedPassword, password string) (VerifyResult, error) {
	var zero VerifyResult
	parts := strings.Split(hashedPassword, "$")

	if len(parts) != 5 || parts[1] != "pbkdf2-sha512" {
		return zero, errors.New("invalid hash format")
	}

	var keySize, iterations int
	_, err := fmt.Sscanf(parts[2], "%d.%d", &keySize, &iterations)
	if err != nil {
		return zero, errors.New("invalid cfg format")
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[3])
	if err != nil {
		return zero, errors.New("invalid salt encoding")
	}

	hashExpected, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return zero, errors.New("invalid hash encoding")
	}

	hash, err := pbkdf2.Key(sha512.New, password, salt, iterations, keySize)
	if err != nil {
		return zero, err
	}

	if subtle.ConstantTimeCompare(hash, hashExpected) != 1 {
		return zero, nil
	} else {
		obsolete := keySize != PBKDF2_KeySize ||
			iterations != PBKDF2_Iterations ||
			len(salt) != PBKDF2_SaltSize

		return VerifyResult{Valid: true, Obsolete: obsolete}, nil
	}
}
