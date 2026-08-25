//go:build integration

package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"auth/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

type strikeResponse struct {
	ID                int64      `json:"id"`
	Username          *string    `json:"username"`
	OperatorUsername  *string    `json:"operatorUsername"`
	Point             int16      `json:"point"`
	RevokedAt         *time.Time `json:"revokedAt"`
	RevokedByUsername *string    `json:"revokedByUsername"`
}

type strikePageResponse struct {
	Total int64            `json:"total"`
	Items []strikeResponse `json:"items"`
}

func TestAdminStrikesLifecycle(t *testing.T) {
	resetDatabase(t)
	_, err := testDB.Exec(`
		INSERT INTO auth_user (username, email, role, password)
		VALUES
			('integration-admin', 'admin@example.com', 'admin', 'unused'),
			('strike-target', 'target@example.com', 'member', 'unused'),
			('other-strike-target', 'other-target@example.com', 'member', 'unused')
	`)
	if err != nil {
		t.Fatalf("insert strike users: %v", err)
	}

	first := postStrike(t, "/v1/admin/strikes", adminAccessToken(t), map[string]any{
		"username": "strike-target", "reason": "spam",
		"evidence": "https://example.com/evidence/1", "point": 2,
	})
	if first.ID == 0 || first.Username == nil || *first.Username != "strike-target" || first.Point != 2 {
		t.Fatalf("unexpected created strike: %#v", first)
	}
	if first.OperatorUsername == nil || *first.OperatorUsername != "integration-admin" {
		t.Fatalf("unexpected strike operator: %#v", first)
	}
	if first.RevokedAt != nil || first.RevokedByUsername != nil {
		t.Fatalf("unexpected created strike: %#v", first)
	}

	postStrike(t, "/v1/admin/strikes", adminAccessToken(t), map[string]any{
		"username": "other-strike-target", "reason": "spam",
		"evidence": "https://example.com/evidence/other",
	})
	orphan := repository.StrikeRecord{
		UserID: 999999, Reason: "orphaned target", Evidence: "historical record",
		Point: 1, CreatedAt: time.Now(), Attr: "{}",
	}
	saveStrikeRecord(t, &orphan)

	page := getStrikePage(t, "/v1/admin/strikes", adminAccessToken(t))
	if page.Total != 3 || len(page.Items) != 3 {
		t.Fatalf("unexpected unfiltered admin strike page: %#v", page)
	}
	foundOrphan := false
	for _, strike := range page.Items {
		if strike.ID == orphan.ID {
			foundOrphan = true
			if strike.Username != nil {
				t.Fatalf("expected nullable username for orphaned strike, got %#v", strike)
			}
			continue
		}
		if strike.Username == nil || strike.OperatorUsername == nil {
			t.Fatalf("expected strike usernames, got %#v", strike)
		}
	}
	if !foundOrphan {
		t.Fatalf("expected orphaned strike in page: %#v", page)
	}
	revokedOrphan := postStrike(t, "/v1/admin/strikes/"+itoa(orphan.ID)+"/revoke", adminAccessToken(t), map[string]any{})
	if revokedOrphan.Username != nil || revokedOrphan.RevokedAt == nil {
		t.Fatalf("expected revocable orphaned strike with nullable username, got %#v", revokedOrphan)
	}

	page = getStrikePage(t, "/v1/admin/strikes?username=strike-target", adminAccessToken(t))
	if page.Total != 1 || len(page.Items) != 1 || page.Items[0].ID != first.ID || page.Items[0].Username == nil || *page.Items[0].Username != "strike-target" {
		t.Fatalf("unexpected filtered admin strike page: %#v", page)
	}

	page = getStrikePage(t, "/v1/admin/strikes?operator_username=integration-admin", adminAccessToken(t))
	if page.Total != 2 || len(page.Items) != 2 {
		t.Fatalf("unexpected operator-filtered admin strike page: %#v", page)
	}

	memberToken := accessToken(t, "strike-target", repository.RoleMember)
	page = getStrikePage(t, "/v1/me/strikes", memberToken)
	if page.Total != 1 || len(page.Items) != 1 || page.Items[0].ID != first.ID {
		t.Fatalf("unexpected user strike page: %#v", page)
	}

	postStrike(t, "/v1/admin/strikes", adminAccessToken(t), map[string]any{
		"username": "strike-target", "reason": "abuse",
		"evidence": "https://example.com/evidence/2",
	})
	user, err := userRepo.FindByUsername("strike-target")
	if err != nil {
		t.Fatalf("find restricted strike target: %v", err)
	}
	if user == nil || user.Role != repository.RoleRestricted {
		t.Fatalf("expected target to be restricted, got %#v", user)
	}

	revoked := postStrike(t, "/v1/admin/strikes/"+itoa(first.ID)+"/revoke", adminAccessToken(t), map[string]any{})
	if revoked.Username == nil || *revoked.Username != "strike-target" || revoked.RevokedAt == nil {
		t.Fatalf("expected complete revocation metadata, got %#v", revoked)
	}
	if revoked.RevokedByUsername == nil || *revoked.RevokedByUsername != "integration-admin" {
		t.Fatalf("expected complete revocation metadata, got %#v", revoked)
	}
	points := strikePoints(t, user.ID, true)
	if points != 1 {
		t.Fatalf("expected revoked strike to be excluded from active points, got %d", points)
	}

	var duplicateEvents int64
	if err := testDB.QueryRow(`
		SELECT count(*)
		FROM auth_event
		WHERE action IN ('strike-user', 'revoke-strike')
	`).Scan(&duplicateEvents); err != nil {
		t.Fatalf("count duplicate strike events: %v", err)
	}
	if duplicateEvents != 0 {
		t.Fatalf("expected strike records to be the sole source of truth, got %d duplicate events", duplicateEvents)
	}
}

func TestSaveAndRestrictUserRollsBackStrikeWhenRoleUpdateFails(t *testing.T) {
	resetDatabase(t)
	record := repository.StrikeRecord{
		UserID:    999999,
		Reason:    "rollback test",
		Evidence:  "integration test",
		Point:     3,
		CreatedAt: time.Now(),
		Attr:      "{}",
	}

	if _, err := strikeRepo.SaveAndRestrictUser(&record, time.Time{}, 3); err == nil {
		t.Fatal("expected missing user role update to fail")
	}

	total, err := strikeRepo.Count(repository.StrikeFilter{UserID: record.UserID})
	if err != nil {
		t.Fatalf("count rolled back strikes: %v", err)
	}
	if total != 0 {
		t.Fatalf("expected strike insert to roll back, got %d records", total)
	}
}

func TestSaveAndRestrictUserDoesNotOverwriteBannedRole(t *testing.T) {
	resetDatabase(t)
	var userID int64
	if err := testDB.QueryRow(`
		INSERT INTO auth_user (username, email, role, password)
		VALUES ('banned-strike-target', 'banned-strike@example.com', 'banned', 'unused')
		RETURNING id
	`).Scan(&userID); err != nil {
		t.Fatalf("insert banned strike target: %v", err)
	}
	record := repository.StrikeRecord{
		UserID:    userID,
		Reason:    "stale member role",
		Evidence:  "integration test",
		Point:     3,
		CreatedAt: time.Now(),
		Attr:      "{}",
	}

	if _, err := strikeRepo.SaveAndRestrictUser(&record, time.Time{}, 3); err == nil {
		t.Fatal("expected role update for banned user to fail")
	}

	user, err := userRepo.FindByUsername("banned-strike-target")
	if err != nil {
		t.Fatalf("find banned strike target: %v", err)
	}
	if user == nil || user.Role != repository.RoleBanned {
		t.Fatalf("expected banned role to be preserved, got %#v", user)
	}
	total, err := strikeRepo.Count(repository.StrikeFilter{UserID: userID})
	if err != nil {
		t.Fatalf("count rolled back banned-user strikes: %v", err)
	}
	if total != 0 {
		t.Fatalf("expected strike insert to roll back, got %d records", total)
	}
}

func TestConcurrentStrikesReachRestrictionThreshold(t *testing.T) {
	resetDatabase(t)
	var userID int64
	if err := testDB.QueryRow(`
		INSERT INTO auth_user (username, email, role, password)
		VALUES ('concurrent-strike-target', 'concurrent-strike@example.com', 'member', 'unused')
		RETURNING id
	`).Scan(&userID); err != nil {
		t.Fatalf("insert concurrent strike target: %v", err)
	}
	initial := repository.StrikeRecord{
		UserID: userID, Reason: "initial strike", Evidence: "integration test",
		Point: 1, CreatedAt: time.Now(), Attr: "{}",
	}
	saveStrikeRecord(t, &initial)

	type strikeResult struct {
		restricted bool
		err        error
	}
	start := make(chan struct{})
	results := make(chan strikeResult, 2)
	for range 2 {
		go func() {
			<-start
			record := repository.StrikeRecord{
				UserID: userID, Reason: "concurrent strike", Evidence: "integration test",
				Point: 1, CreatedAt: time.Now(), Attr: "{}",
			}
			restricted, err := strikeRepo.SaveAndRestrictUser(&record, time.Time{}, 3)
			results <- strikeResult{restricted: restricted, err: err}
		}()
	}
	close(start)

	restricted := false
	for range 2 {
		result := <-results
		if result.err != nil {
			t.Fatalf("save concurrent strike: %v", result.err)
		}
		restricted = restricted || result.restricted
	}
	if !restricted {
		t.Fatal("expected concurrent strikes to reach the restriction threshold")
	}
	user, err := userRepo.FindByUsername("concurrent-strike-target")
	if err != nil {
		t.Fatalf("find concurrent strike target: %v", err)
	}
	if user == nil || user.Role != repository.RoleRestricted {
		t.Fatalf("expected target to be restricted, got %#v", user)
	}
	total := strikePoints(t, userID, false)
	if total != 3 {
		t.Fatalf("expected 3 strike points, got %d", total)
	}
}

func TestConcurrentStrikeRevokeOnlySucceedsOnce(t *testing.T) {
	resetDatabase(t)
	var userID int64
	if err := testDB.QueryRow(`
		INSERT INTO auth_user (username, email, role, password)
		VALUES ('revoke-target', 'revoke@example.com', 'member', 'unused')
		RETURNING id
	`).Scan(&userID); err != nil {
		t.Fatalf("insert revoke target: %v", err)
	}
	record := repository.StrikeRecord{
		UserID:    userID,
		Reason:    "concurrent revoke test",
		Evidence:  "integration test",
		Point:     1,
		CreatedAt: time.Now(),
		Attr:      "{}",
	}
	saveStrikeRecord(t, &record)

	type revokeResult struct {
		revoked bool
		err     error
	}
	start := make(chan struct{})
	results := make(chan revokeResult, 2)
	for range 2 {
		go func() {
			<-start
			revoked, err := strikeRepo.Revoke(record.ID, 123, time.Now())
			results <- revokeResult{revoked: revoked != nil, err: err}
		}()
	}
	close(start)

	succeeded := 0
	for range 2 {
		result := <-results
		if result.err != nil {
			t.Fatalf("revoke strike concurrently: %v", result.err)
		}
		if result.revoked {
			succeeded++
		}
	}
	if succeeded != 1 {
		t.Fatalf("expected exactly one successful revoke, got %d", succeeded)
	}
}

func postStrike(t *testing.T, path, token string, body map[string]any) strikeResponse {
	t.Helper()
	encoded, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("encode strike request: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, Url+path, bytes.NewReader(encoded))
	if err != nil {
		t.Fatalf("create strike request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("send strike request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		responseBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected strike status 200, got %d: %s", resp.StatusCode, responseBody)
	}
	var response strikeResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode strike response: %v", err)
	}
	return response
}

func getStrikePage(t *testing.T, path, token string) strikePageResponse {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, Url+path, nil)
	if err != nil {
		t.Fatalf("create strike list request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("send strike list request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		responseBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected strike list status 200, got %d: %s", resp.StatusCode, responseBody)
	}
	var response strikePageResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode strike page response: %v", err)
	}
	return response
}

func saveStrikeRecord(t *testing.T, record *repository.StrikeRecord) {
	t.Helper()
	err := testDB.QueryRow(`
		INSERT INTO auth_strike_record (
			user_id, operator_id, reason, evidence, point, created_at, attr
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`,
		record.UserID,
		record.OperatorID,
		record.Reason,
		record.Evidence,
		record.Point,
		record.CreatedAt,
		record.Attr,
	).Scan(&record.ID)
	if err != nil {
		t.Fatalf("save strike record: %v", err)
	}
}

func strikePoints(t *testing.T, userID int64, activeOnly bool) int64 {
	t.Helper()
	query := `
		SELECT coalesce(sum(point), 0)
		FROM auth_strike_record
		WHERE user_id = $1
	`
	if activeOnly {
		query += " AND revoked_at IS NULL"
	}
	var points int64
	if err := testDB.QueryRow(query, userID).Scan(&points); err != nil {
		t.Fatalf("sum strike points: %v", err)
	}
	return points
}

func accessToken(t *testing.T, username, role string) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": username, "role": role, "exp": time.Now().Add(time.Hour).Unix(),
	})
	value, err := token.SignedString([]byte(testAccessTokenSecret))
	if err != nil {
		t.Fatalf("sign access token: %v", err)
	}
	return value
}

func itoa(value int64) string {
	return fmt.Sprintf("%d", value)
}
