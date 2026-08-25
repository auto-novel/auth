package service

import (
	"encoding/json"
	"testing"
	"time"
)

func TestMeStrikeResponseOnlyContainsUserFacingFields(t *testing.T) {
	revokedAt := time.Now()
	encoded, err := json.Marshal(MeStrikeResponse{
		ID:        1,
		Reason:    "spam",
		Evidence:  "https://example.com/evidence",
		Point:     1,
		CreatedAt: time.Now(),
		RevokedAt: &revokedAt,
	})
	if err != nil {
		t.Fatalf("marshal me strike response: %v", err)
	}

	var fields map[string]json.RawMessage
	if err := json.Unmarshal(encoded, &fields); err != nil {
		t.Fatalf("decode me strike response: %v", err)
	}

	expected := []string{"id", "reason", "evidence", "point", "createdAt", "revokedAt"}
	if len(fields) != len(expected) {
		t.Fatalf("unexpected me strike response fields: %v", fields)
	}
	for _, field := range expected {
		if _, ok := fields[field]; !ok {
			t.Errorf("missing me strike response field %q", field)
		}
	}
}
