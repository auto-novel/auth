//go:build integration

package tests

import (
	"auth/internal/infra"
	"auth/internal/repository"
	"auth/internal/service"
	"auth/internal/util"
	"context"
	"database/sql"
	"fmt"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
)

const (
	testAccessTokenSecret  = "integration-test-access-token-secret"
	testRefreshTokenSecret = "integration-test-refresh-token-secret"
)

var (
	testDB   *sql.DB
	userRepo repository.UserRepository
	otpRepo  repository.OtpRepository
)

type noopEmailClient struct{}

func (noopEmailClient) SendEmail(string, string, string) error { return nil }

func TestMain(m *testing.M) {
	port := envInt("TEST_DB_PORT", 4002)
	testDB = infra.NewSqlDb(
		env("TEST_DB_HOST", "localhost"),
		port,
		env("TEST_DB_USER", "auth"),
		env("TEST_DB_PASSWORD", "auth-test-password"),
		env("TEST_DB_NAME", "auth_test"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err := testDB.PingContext(ctx)
	cancel()
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration database is unavailable: %v\n", err)
		fmt.Fprintln(os.Stderr, "run from the repository root: ./api/tests/run.sh")
		os.Exit(1)
	}

	userRepo = repository.NewUserRepository(testDB)
	otpRepo = repository.NewOtpRepository(testDB)
	eventRepo := repository.NewEventRepository(testDB)
	authService := service.NewAuthService(userRepo, eventRepo, otpRepo, noopEmailClient{})

	util.AccessTokenSecret = testAccessTokenSecret
	util.RefreshTokenSecret = testRefreshTokenSecret

	router := chi.NewRouter()
	router.Use(middleware.Recoverer)
	router.Route("/v1/auth", authService.Use)
	server := httptest.NewServer(router)
	Url = server.URL
	Client = server.Client()

	if _, err := testDB.Exec("TRUNCATE auth_event, auth_otp, auth_user RESTART IDENTITY"); err != nil {
		fmt.Fprintf(os.Stderr, "reset integration database: %v\n", err)
		server.Close()
		testDB.Close()
		os.Exit(1)
	}

	code := m.Run()
	server.Close()
	if _, err := testDB.Exec("TRUNCATE auth_event, auth_otp, auth_user RESTART IDENTITY"); err != nil {
		fmt.Fprintf(os.Stderr, "clean integration database: %v\n", err)
		code = 1
	}
	if err := testDB.Close(); err != nil {
		fmt.Fprintf(os.Stderr, "close integration database: %v\n", err)
		code = 1
	}
	os.Exit(code)
}

func resetDatabase(t *testing.T) {
	t.Helper()
	_, err := testDB.Exec("TRUNCATE auth_event, auth_otp, auth_user RESTART IDENTITY")
	if err != nil {
		t.Fatalf("reset integration database: %v", err)
	}
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
