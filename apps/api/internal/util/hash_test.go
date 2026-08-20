package util

import (
	"testing"
)

func TestHashBasic(t *testing.T) {
	password := "mySecretPassword123!"

	hashedPassword, err := GenerateHash(password)
	if err != nil {
		t.Fatalf("Generate returned error: %v", err)
	}

	result, err := ValidateHash(hashedPassword, password)
	if err != nil || !result.Valid || result.Obsolete {
		t.Errorf("Validate failed for correct password, error: %v", err)
	}

	result, err = ValidateHash(hashedPassword, "wrongPassword")
	if err != nil || result.Valid || result.Obsolete {
		t.Errorf("Validate succeeded for incorrect password, error: %v", err)
	}
}
