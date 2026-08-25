package main

import (
	"auth/internal/infra"
	"auth/internal/repository"
	"auth/internal/service"
	"auth/internal/util"
	"context"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

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

func runOtpCleanup(ctx context.Context, repo repository.OtpRepository, interval time.Duration) {
	cleanup := func() {
		deleted, err := repo.DeleteExpiredOtps()
		if err != nil {
			slog.Error("Failed to delete expired OTPs", "error", err)
			return
		}
		if deleted > 0 {
			slog.Info("Deleted expired OTPs", "count", deleted)
		}
	}

	cleanup()
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			cleanup()
		}
	}
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
		envInt("DB_PORT", 4001),
		env("DB_USER", "auth"),
		env("DB_PASSWORD", ""),
		env("DB_NAME", "auth"),
	)
	email := infra.NewEmailClient(
		env("MAILGUN_DOMAIN", ""),
		env("MAILGUN_APIKEY", ""),
	)

	// repository
	userRepo := repository.NewUserRepository(db)
	eventRepo := repository.NewEventRepository(db)
	otpRepo := repository.NewOtpRepository(db)
	settingRepo := repository.NewSettingRepository(db)
	strikeRepo := repository.NewStrikeRepository(db)
	if err := settingRepo.Load(); err != nil {
		slog.Error("Failed to load auth settings", "error", err)
		return
	}
	otpCleanupCtx, stopOtpCleanup := context.WithCancel(context.Background())
	defer stopOtpCleanup()
	go runOtpCleanup(
		otpCleanupCtx,
		otpRepo,
		time.Hour,
	)

	// service
	authService := service.NewAuthService(
		userRepo,
		eventRepo,
		otpRepo,
		email,
		settingRepo,
	)
	adminService := service.NewAdminService(
		userRepo,
		eventRepo,
		settingRepo,
	)
	adminStrikeService := service.NewAdminStrikeService(
		userRepo,
		eventRepo,
		strikeRepo,
	)
	meService := service.NewMeService(userRepo, strikeRepo)

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
		router.Route("/admin", func(router chi.Router) {
			router.Use(util.RequireAdmin)
			adminService.Use(router)
			router.Route("/strikes", adminStrikeService.Use)
		})
		router.Route("/me", func(router chi.Router) {
			router.Use(util.RequireAccessToken)
			meService.Use(router)
		})
	})

	// start server
	slog.Info("Listening on localhost:8080...")
	http.ListenAndServe(":8080", router)
}
