package main

import (
	"auth/internal/infra"
	"auth/internal/repository"
	"auth/internal/service"
	"auth/internal/util"
	"log/slog"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		intValue, err := strconv.Atoi(value)
		if err == nil {
			return intValue
		}
	}
	return fallback
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// util
	util.RefreshTokenSecret = env("REFRESH_TOKEN_SECRET", "secret")
	util.AccessTokenSecret = env("ACCESS_TOKEN_SECRET", "secret")

	// infra
	db := infra.NewSqlDb(
		env("DB_HOST", "localhost"),
		envInt("DB_PORT", 4002),
		env("DB_USER", "auth"),
		env("DB_PASSWORD", ""),
		env("DB_NAME", "auth"),
	)
	rdb := infra.NewRedis(
		env("RDB_HOST", "localhost"),
		envInt("RDB_PORT", 4003),
		env("RDB_USER", "auth"),
		env("RDB_PASSWORD", ""),
	)
	email := infra.NewEmailClient(
		env("MAILGUN_DOMAIN", ""),
		env("MAILGUN_APIKEY", ""),
	)

	// repository
	userRepo := repository.NewUserRepository(db)
	eventRepo := repository.NewEventRepository(db)
	otpRepo := repository.NewOtpRepository(rdb)

	// service
	authService := service.NewAuthService(
		userRepo,
		eventRepo,
		otpRepo,
		email,
	)
	adminService := service.NewAdminService(
		userRepo,
		eventRepo,
	)

	// router
	router := chi.NewRouter()
	router.Use(middleware.Recoverer)

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK\n"))
	})
	router.Route("/v1", func(router chi.Router) {
		router.Use(util.RequestLogger())
		router.Route("/auth", authService.Use)
		router.Route("/admin", adminService.Use)
	})

	// start server
	slog.Info("Listening on localhost:8080...")
	http.ListenAndServe(":8080", router)
}
