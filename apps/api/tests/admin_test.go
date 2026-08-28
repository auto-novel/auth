//go:build integration

package tests

import (
	"auth/internal/repository"
	"encoding/json"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type overviewResponse struct {
	AuthActivity []struct {
		Date          string `json:"date"`
		LoginCount    int64  `json:"loginCount"`
		RegisterCount int64  `json:"registerCount"`
	} `json:"authActivity"`
	Summary struct {
		LoginCount int64 `json:"loginCount"`
		NewUsers   int64 `json:"newUsers"`
	} `json:"summary"`
	PreviousSummary struct {
		LoginCount int64 `json:"loginCount"`
		NewUsers   int64 `json:"newUsers"`
	} `json:"previousSummary"`
}

type overviewUserSummaryResponse struct {
	TotalUsers      int64 `json:"totalUsers"`
	RestrictedUsers int64 `json:"restrictedUsers"`
	BannedUsers     int64 `json:"bannedUsers"`
}

func TestAdminOverview(t *testing.T) {
	resetDatabase(t)

	_, err := testDB.Exec(`
		INSERT INTO auth_event (action, created_at)
		VALUES
			('login', '2026-08-01 08:00:00+08'),
			('login', '2026-08-01 23:59:59+08'),
			('register', '2026-08-01 12:00:00+08'),
			('register', '2026-08-03 00:00:00+08'),
			('login', '2026-07-31 23:59:59+08'),
			('login', '2026-08-04 00:00:00+08')
	`)
	if err != nil {
		t.Fatalf("insert authentication events: %v", err)
	}
	_, err = testDB.Exec(`
		INSERT INTO auth_user (username, email, role, password, created_at)
		VALUES
			('previous-user', 'previous@example.com', 'member', 'unused', '2026-07-31 12:00:00+08'),
			('first-user', 'first@example.com', 'member', 'unused', '2026-08-01 00:00:00+08'),
			('second-user', 'second@example.com', 'member', 'unused', '2026-08-03 23:59:59+08'),
			('future-user', 'future@example.com', 'member', 'unused', '2026-08-04 00:00:00+08')
	`)
	if err != nil {
		t.Fatalf("insert overview activity users: %v", err)
	}

	response := getAdminOverview(t, "2026-08-01", "2026-08-03")
	if len(response.AuthActivity) != 3 {
		t.Fatalf("expected 3 activity items, got %d", len(response.AuthActivity))
	}

	expected := []struct {
		date          string
		loginCount    int64
		registerCount int64
	}{
		{date: "2026-08-01", loginCount: 2, registerCount: 1},
		{date: "2026-08-02", loginCount: 0, registerCount: 0},
		{date: "2026-08-03", loginCount: 0, registerCount: 1},
	}
	for i, item := range response.AuthActivity {
		want := expected[i]
		if item.Date != want.date ||
			item.LoginCount != want.loginCount ||
			item.RegisterCount != want.registerCount {
			t.Fatalf("unexpected activity item %d: %#v", i, item)
		}
	}
	if response.Summary.LoginCount != 2 || response.Summary.NewUsers != 2 {
		t.Fatalf("unexpected activity summary: %#v", response.Summary)
	}
	if response.PreviousSummary.LoginCount != 1 || response.PreviousSummary.NewUsers != 1 {
		t.Fatalf("unexpected previous activity summary: %#v", response.PreviousSummary)
	}
}

func TestAdminOverviewUserSummary(t *testing.T) {
	resetDatabase(t)

	_, err := testDB.Exec(`
		INSERT INTO auth_user (username, email, role, password)
		VALUES
			('member-user', 'member@example.com', 'member', 'unused'),
			('restricted-user', 'restricted@example.com', 'restricted', 'unused'),
			('banned-user', 'banned@example.com', 'banned', 'unused'),
			('admin-user', 'admin@example.com', 'admin', 'unused')
	`)
	if err != nil {
		t.Fatalf("insert overview users: %v", err)
	}

	req, err := http.NewRequest(
		http.MethodGet,
		Url+"/v1/admin/overview/user-summary",
		nil,
	)
	if err != nil {
		t.Fatalf("create overview user summary request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+adminAccessToken(t))

	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("send overview user summary request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected status 200, got %d: %s", resp.StatusCode, body)
	}

	var response overviewUserSummaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode overview user summary response: %v", err)
	}
	if response.TotalUsers != 4 || response.RestrictedUsers != 1 || response.BannedUsers != 1 {
		t.Fatalf("unexpected overview user summary: %#v", response)
	}
}

func TestAdminOverviewUsesShanghaiTimezoneRules(t *testing.T) {
	resetDatabase(t)

	_, err := testDB.Exec(`
		INSERT INTO auth_event (action, created_at)
		VALUES
			('login', '1991-05-31 23:59:59+09'),
			('login', '1991-06-01 00:30:00+09'),
			('register', '1991-06-01 23:59:59+09'),
			('register', '1991-06-02 00:00:00+09')
	`)
	if err != nil {
		t.Fatalf("insert daylight saving authentication events: %v", err)
	}

	response := getAdminOverview(t, "1991-06-01", "1991-06-01")
	if len(response.AuthActivity) != 1 {
		t.Fatalf("expected 1 activity item, got %d", len(response.AuthActivity))
	}

	item := response.AuthActivity[0]
	if item.Date != "1991-06-01" || item.LoginCount != 1 || item.RegisterCount != 1 {
		t.Fatalf("unexpected daylight saving activity item: %#v", item)
	}
}

func TestAdminOverviewRejectsMoreThanThirtyDays(t *testing.T) {
	req, err := http.NewRequest(
		http.MethodGet,
		Url+"/v1/admin/overview/activity?start_date=2026-08-01&end_date=2026-08-31",
		nil,
	)
	if err != nil {
		t.Fatalf("create overview request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+adminAccessToken(t))

	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("send overview request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected status 400, got %d: %s", resp.StatusCode, body)
	}
}

func getAdminOverview(t *testing.T, startDate, endDate string) overviewResponse {
	t.Helper()
	req, err := http.NewRequest(
		http.MethodGet,
		Url+"/v1/admin/overview/activity?start_date="+startDate+"&end_date="+endDate,
		nil,
	)
	if err != nil {
		t.Fatalf("create overview request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+adminAccessToken(t))

	resp, err := Client.Do(req)
	if err != nil {
		t.Fatalf("send overview request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected status 200, got %d: %s", resp.StatusCode, body)
	}

	var response overviewResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode overview response: %v", err)
	}
	return response
}

func adminAccessToken(t *testing.T) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  "integration-admin",
		"role": repository.RoleAdmin,
		"exp":  time.Now().Add(time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte(testAccessTokenSecret))
	if err != nil {
		t.Fatalf("sign admin access token: %v", err)
	}
	return tokenString
}
