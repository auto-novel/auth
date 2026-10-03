//go:build integration

package tests

import (
	"auth/internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

type myStrikePage struct {
	strikePageResponse
	LatestStrikeID int64 `json:"latestStrikeId"`
}

func meRequest(t *testing.T, method, path, token, body string, status int, dest any) {
	t.Helper()
	req, err := http.NewRequest(method, Url+"/v1/me"+path, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := Client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != status {
		t.Fatalf("%s %s: got %d, want %d: %s", method, path, resp.StatusCode, status, data)
	}
	if dest != nil {
		if err := json.Unmarshal(data, dest); err != nil {
			t.Fatal(err)
		}
	}
}

func assertStrikeUnread(t *testing.T, token string, want bool) {
	t.Helper()
	var result struct {
		Strikes struct {
			HasUnread bool `json:"hasUnread"`
		} `json:"strikes"`
	}
	meRequest(t, "GET", "/attention-status", token, "", http.StatusOK, &result)
	if result.Strikes.HasUnread != want {
		t.Fatalf("strikes.hasUnread = %v, want %v", result.Strikes.HasUnread, want)
	}
}

func markStrikesRead(t *testing.T, token string, id int64, wantUnread bool) {
	t.Helper()
	var result struct {
		HasUnread bool `json:"hasUnread"`
	}
	meRequest(t, "PUT", "/strikes/read-state", token, fmt.Sprintf(`{"throughId":%d}`, id), http.StatusOK, &result)
	if result.HasUnread != wantUnread {
		t.Fatalf("hasUnread after marking %d = %v, want %v", id, result.HasUnread, wantUnread)
	}
}

func insertStrikeReader(t *testing.T, username string) (int64, string) {
	t.Helper()
	var id int64
	// The old INSERT column list must continue working after schema upgrades.
	err := testDB.QueryRow(`INSERT INTO auth_user (username, email, role, password)
		VALUES ($1, $2, 'restricted', 'unused') RETURNING id`, username, username+"@example.com").Scan(&id)
	if err != nil {
		t.Fatal(err)
	}
	return id, accessToken(t, username, repository.RoleRestricted)
}

func insertUnreadStrike(t *testing.T, userID int64) repository.StrikeRecord {
	t.Helper()
	record := repository.StrikeRecord{UserID: userID, Reason: "spam", Evidence: "test", Point: 1, CreatedAt: time.Now().UTC(), Attr: "{}"}
	saveStrikeRecord(t, &record)
	return record
}

func TestMyStrikeReadLifecycle(t *testing.T) {
	resetDatabase(t)
	userID, token := insertStrikeReader(t, "reader")
	otherID, otherToken := insertStrikeReader(t, "other-reader")
	assertStrikeUnread(t, token, false)
	var page myStrikePage
	meRequest(t, "GET", "/strikes", token, "", http.StatusOK, &page)
	if page.LatestStrikeID != 0 || page.Total != 0 || page.Items == nil || len(page.Items) != 0 {
		t.Fatalf("unexpected empty page: %#v", page)
	}
	markStrikesRead(t, token, 0, false)

	first := insertUnreadStrike(t, userID)
	assertStrikeUnread(t, token, true)
	assertStrikeUnread(t, otherToken, false)
	// Viewing a list alone must not mutate the read cursor.
	meRequest(t, "GET", "/strikes", token, "", http.StatusOK, &page)
	if page.LatestStrikeID != first.ID || page.Total != 1 {
		t.Fatalf("unexpected page: %#v", page)
	}
	assertStrikeUnread(t, token, true)

	// A strike arriving between list loading and acknowledgement stays unread.
	second := insertUnreadStrike(t, userID)
	markStrikesRead(t, token, page.LatestStrikeID, true)
	assertStrikeUnread(t, token, true)
	insertUnreadStrike(t, otherID)
	for _, query := range []string{"?page=2&page_size=1", "?page=99", "?created_before=1"} {
		meRequest(t, "GET", "/strikes"+query, token, "", http.StatusOK, &page)
		if page.LatestStrikeID != second.ID {
			t.Fatalf("boundary must be scoped to user, independent of pagination/filter: %#v", page)
		}
	}
	// Revocation does not hide an unread record or create another notification.
	if _, err := strikeRepo.Revoke(second.ID, otherID, time.Now()); err != nil {
		t.Fatal(err)
	}
	assertStrikeUnread(t, token, true)
	markStrikesRead(t, token, second.ID, false)
	for _, id := range []int64{second.ID, first.ID, 0} {
		markStrikesRead(t, token, id, false)
	}
	assertStrikeUnread(t, token, false)
	assertStrikeUnread(t, otherToken, true)
	if _, err := strikeRepo.Revoke(first.ID, otherID, time.Now()); err != nil {
		t.Fatal(err)
	}
	assertStrikeUnread(t, token, false)
	insertUnreadStrike(t, userID)
	assertStrikeUnread(t, token, true)
}

func TestMyStrikeReadValidation(t *testing.T) {
	resetDatabase(t)
	userID, token := insertStrikeReader(t, "reader")
	otherID, _ := insertStrikeReader(t, "other-reader")
	own := insertUnreadStrike(t, userID)
	other := insertUnreadStrike(t, otherID)
	for _, body := range []string{
		`{}`, `null`, `{"throughId":null}`, `{"throughId":-1}`, `{"throughId":1.5}`,
		`{"throughId":"1"}`, `{"throughId":9223372036854775808}`, `{"throughId":`,
		fmt.Sprintf(`{"throughId":%d}`, other.ID), `{"throughId":999999}`,
	} {
		meRequest(t, "PUT", "/strikes/read-state", token, body, http.StatusBadRequest, nil)
	}
	assertStrikeUnread(t, token, true)
	for _, endpoint := range []struct{ method, path string }{{"GET", "/strikes"}, {"GET", "/attention-status"}, {"PUT", "/strikes/read-state"}} {
		for _, invalidToken := range []string{"", "invalid", accessToken(t, "missing-user", repository.RoleMember)} {
			meRequest(t, endpoint.method, endpoint.path, invalidToken, `{"throughId":0}`, http.StatusUnauthorized, nil)
		}
	}
	markStrikesRead(t, token, own.ID, false)
}

func TestConcurrentStrikeReadDoesNotRegress(t *testing.T) {
	resetDatabase(t)
	userID, token := insertStrikeReader(t, "reader")
	first := insertUnreadStrike(t, userID)
	second := insertUnreadStrike(t, userID)
	start := make(chan struct{})
	results := make(chan error, 21)
	for i := range 20 {
		id := first.ID
		if i%2 == 0 {
			id = second.ID
		}
		go func() {
			<-start
			_, err := strikeRepo.MarkStrikesRead(context.Background(), userID, id)
			results <- err
		}()
	}
	go func() {
		<-start
		record := repository.StrikeRecord{UserID: userID, Reason: "new strike", Evidence: "test", Point: 1, CreatedAt: time.Now().UTC(), Attr: "{}"}
		_, err := strikeRepo.SaveAndRestrictUser(&record, time.Time{}, 1000)
		results <- err
	}()
	close(start)
	for range 21 {
		if err := <-results; err != nil {
			t.Fatal(err)
		}
	}
	user, err := userRepo.FindByUsername("reader")
	if err != nil {
		t.Fatal(err)
	}
	if user.LastSeenStrikeID != second.ID {
		t.Fatalf("read cursor = %d, want %d", user.LastSeenStrikeID, second.ID)
	}
	assertStrikeUnread(t, token, true)
}

func TestStrikeReadSchemaUpgrade(t *testing.T) {
	// Exercise the real schema script against old tables in an isolated schema.
	ctx := context.Background()
	conn, err := testDB.Conn(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	if _, err := conn.ExecContext(ctx, `CREATE SCHEMA strike_read_upgrade_test`); err != nil {
		t.Fatal(err)
	}
	defer func() {
		if _, err := conn.ExecContext(ctx, `ROLLBACK; SET search_path TO public; DROP SCHEMA strike_read_upgrade_test CASCADE`); err != nil {
			t.Error(err)
		}
	}()
	_, err = conn.ExecContext(ctx, `
		SET search_path TO strike_read_upgrade_test;
		CREATE TABLE auth_user (LIKE public.auth_user INCLUDING ALL);
		ALTER TABLE auth_user DROP COLUMN last_seen_strike_id;
		CREATE TABLE auth_strike_record (LIKE public.auth_strike_record INCLUDING ALL);
		INSERT INTO auth_user (username, email, role, password) VALUES ('legacy', 'legacy@example.com', 'member', 'unused');
		INSERT INTO auth_strike_record (user_id, reason, evidence) SELECT id, 'legacy', 'test' FROM auth_user;
	`)
	if err != nil {
		t.Fatal(err)
	}
	schema, err := os.ReadFile("../../../sql/init.sql")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := conn.ExecContext(ctx, string(schema)); err != nil {
		t.Fatal(err)
	}
	var seen int64
	if err := conn.QueryRowContext(ctx, `SELECT last_seen_strike_id FROM auth_user WHERE username = 'legacy'`).Scan(&seen); err != nil {
		t.Fatal(err)
	}
	if seen != 0 {
		t.Fatalf("legacy strikes must stay unread, got cursor %d", seen)
	}
	if _, err := conn.ExecContext(ctx, `UPDATE auth_user SET last_seen_strike_id = (SELECT MAX(id) FROM auth_strike_record)`); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.ExecContext(ctx, string(schema)); err != nil {
		t.Fatal(err)
	}
	if err := conn.QueryRowContext(ctx, `SELECT last_seen_strike_id FROM auth_user WHERE username = 'legacy'`).Scan(&seen); err != nil {
		t.Fatal(err)
	}
	if seen != 1 {
		t.Fatalf("reapplying schema must preserve read cursor, got %d", seen)
	}
	if err := conn.QueryRowContext(ctx, `INSERT INTO auth_user (username, email, role, password)
		VALUES ('new', 'new@example.com', 'member', 'unused') RETURNING last_seen_strike_id`).Scan(&seen); err != nil {
		t.Fatal(err)
	}
	if seen != 0 {
		t.Fatalf("new user cursor = %d, want 0", seen)
	}
}
