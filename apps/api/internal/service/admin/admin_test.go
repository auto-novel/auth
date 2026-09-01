package admin

import (
	authservice "auth/internal/service/auth"
	"encoding/json"
	"testing"
	"time"
)

func TestAdminResponsesUseConsistentResourceTypes(t *testing.T) {
	timestamp := time.Date(2026, time.August, 26, 12, 34, 56, 0, time.UTC)
	username := "alice"

	tests := []struct {
		name     string
		response any
		check    func(*testing.T, map[string]any)
	}{
		{
			name: "user",
			response: UserResponse{
				ID: 1, Username: "alice", Email: "alice@example.com", Role: "member",
				CreatedAt: timestamp, LastLogin: timestamp, Attr: json.RawMessage(`{"theme":"dark"}`),
			},
			check: func(t *testing.T, fields map[string]any) {
				if fields["username"] != "alice" {
					t.Fatalf("expected username field, got %#v", fields)
				}
				if _, exists := fields["name"]; exists {
					t.Fatalf("unexpected legacy name field: %#v", fields)
				}
				assertRFC3339Field(t, fields, "createdAt", timestamp)
				assertRFC3339Field(t, fields, "lastLogin", timestamp)
				assertObjectField(t, fields, "attr")
			},
		},
		{
			name: "event",
			response: EventResponse{
				ID: 1, Action: authservice.EventLogin,
				Detail: json.RawMessage(`{"actor_user":"alice"}`), CreatedAt: timestamp,
			},
			check: func(t *testing.T, fields map[string]any) {
				assertObjectField(t, fields, "detail")
				assertRFC3339Field(t, fields, "createdAt", timestamp)
			},
		},
		{
			name: "strike",
			response: StrikeResponse{
				ID: 1, Username: &username, Reason: "spam", Evidence: "evidence", Point: 1,
				CreatedAt: timestamp, Attr: json.RawMessage(`{"source":"manual"}`),
			},
			check: func(t *testing.T, fields map[string]any) {
				if fields["username"] != "alice" {
					t.Fatalf("expected username field, got %#v", fields)
				}
				for _, field := range []string{"userId", "operatorId", "revokedBy"} {
					if _, exists := fields[field]; exists {
						t.Fatalf("unexpected user ID field %q: %#v", field, fields)
					}
				}
				assertObjectField(t, fields, "attr")
				assertRFC3339Field(t, fields, "createdAt", timestamp)
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			encoded, err := json.Marshal(test.response)
			if err != nil {
				t.Fatalf("marshal response: %v", err)
			}
			var fields map[string]any
			if err := json.Unmarshal(encoded, &fields); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			test.check(t, fields)
		})
	}
}

func TestJSONObject(t *testing.T) {
	tests := []struct {
		name     string
		value    string
		expected string
	}{
		{name: "object", value: `{"theme":"dark"}`, expected: `{"theme":"dark"}`},
		{name: "empty object", value: `{}`, expected: `{}`},
		{name: "null", value: `null`, expected: `{}`},
		{name: "array", value: `[]`, expected: `{}`},
		{name: "string", value: `"legacy"`, expected: `{}`},
		{name: "invalid", value: ``, expected: `{}`},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := jsonObject(test.value)
			if string(actual) != test.expected {
				t.Fatalf("unexpected JSON object: got %s, want %s", actual, test.expected)
			}
		})
	}
}

func assertObjectField(t *testing.T, fields map[string]any, name string) {
	t.Helper()
	if _, ok := fields[name].(map[string]any); !ok {
		t.Fatalf("expected %s to be a JSON object, got %#v", name, fields[name])
	}
}

func assertRFC3339Field(t *testing.T, fields map[string]any, name string, expected time.Time) {
	t.Helper()
	value, ok := fields[name].(string)
	if !ok {
		t.Fatalf("expected %s to be a string, got %#v", name, fields[name])
	}
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		t.Fatalf("expected %s to use RFC 3339: %v", name, err)
	}
	if !parsed.Equal(expected) {
		t.Fatalf("unexpected %s: got %s, want %s", name, parsed, expected)
	}
}
