package service

import (
	"auth/internal/authn"
	"auth/internal/httpx"
	"auth/internal/infra"
	"auth/internal/repository"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/go-chi/chi/v5"
)

const (
	EventLogin         string = "login"
	EventRegister      string = "register"
	EventLogout        string = "logout"
	EventOtp           string = "otp"
	EventResetPassword string = "reset_password"
)

type AuthService interface {
	Use(chi.Router)
	Register(http.ResponseWriter, *http.Request) error
	Login(http.ResponseWriter, *http.Request) error
	Refresh(http.ResponseWriter, *http.Request) error
	Logout(http.ResponseWriter, *http.Request) error
	RequestOtp(http.ResponseWriter, *http.Request) error
	ResetPassword(http.ResponseWriter, *http.Request) error
}

type authService struct {
	userRepo    repository.UserRepository
	eventRepo   repository.EventRepository
	otpRepo     repository.OtpRepository
	email       infra.EmailClient
	settingRepo repository.SettingRepository
}

func NewAuthService(
	userRepo repository.UserRepository,
	eventRepo repository.EventRepository,
	otpRepo repository.OtpRepository,
	email infra.EmailClient,
	settingRepo repository.SettingRepository,
) AuthService {
	s := &authService{
		userRepo:    userRepo,
		eventRepo:   eventRepo,
		otpRepo:     otpRepo,
		email:       email,
		settingRepo: settingRepo,
	}
	return s
}

func (s *authService) Use(router chi.Router) {
	router.Group(func(router chi.Router) {
		router.Use(httpx.RateLimiter(100))
		router.Post("/register", httpx.EH(s.Register))
	})
	router.Group(func(router chi.Router) {
		router.Use(httpx.RateLimiter(100))
		router.Post("/otp/request", httpx.EH(s.RequestOtp))
	})

	router.Post("/login", httpx.EH(s.Login))
	router.Post("/logout", httpx.EH(s.Logout))
	router.Post("/refresh", httpx.EH(s.Refresh))
	router.Post("/password/reset", httpx.EH(s.ResetPassword))
}

func validateUserCanAuthenticate(user *repository.User) error {
	switch user.Role {
	case repository.RoleBanned:
		return httpx.Forbidden("用户已被封禁")
	default:
		return nil
	}
}

func validateUsername(username string) error {
	if strings.TrimSpace(username) != username {
		return httpx.BadRequest("用户名前后不能有空格")
	}
	for _, r := range username {
		if !unicode.IsPrint(r) {
			return httpx.BadRequest("用户名只能包含可打印字符")
		}
		if r == '@' {
			return httpx.BadRequest("用户名不能包含@字符")
		}
	}
	return nil
}

func validatePassword(password string) error {
	for _, r := range password {
		if !unicode.IsPrint(r) {
			return httpx.BadRequest("密码只能包含可打印字符")
		}
		if unicode.IsSpace(r) {
			return httpx.BadRequest("密码不能包含空格")
		}
	}
	return nil
}

func (s *authService) Register(w http.ResponseWriter, r *http.Request) error {
	settings := s.settingRepo.Get()
	if !settings.RegisterEnabled {
		return httpx.Forbidden("注册功能已关闭")
	}

	req, err := httpx.Body[struct {
		App      string `json:"app" label:"应用名" validate:"required"`
		Username string `json:"username" label:"用户名" validate:"required,min=2,max=16"`
		Password string `json:"password" label:"密码" validate:"required,min=8,max=100"`
		Email    string `json:"email" label:"邮箱" validate:"required,email"`
		Otp      string `json:"otp" label:"验证码" validate:"required,numeric,len=6"`
	}](r)
	if err != nil {
		slog.Error("Register request body parse error", "error", err)
		return err
	}
	if err := validateUsername(req.Username); err != nil {
		slog.Error("Invalid username", "username", req.Username, "error", err)
		return err
	}
	if err := validatePassword(req.Password); err != nil {
		slog.Error("Invalid password", "error", err)
		return err
	}
	if _, err := authn.TokenPolicyForApp(req.App); err != nil {
		return err
	}
	hashedPassword, err := authn.GenerateHash(req.Password)
	if err != nil {
		slog.Error("Password hash error", "error", err)
		return httpx.InternalError(err, "密码哈希失败")
	}

	validOtp, err := s.otpRepo.CheckOtp(repository.OtpVerify, req.Email, req.Otp)
	if err != nil {
		slog.Error("Failed to verify OTP", "email", req.Email, "error", err)
		return httpx.InternalError(err, "验证码校验失败")
	}
	if !validOtp {
		slog.Error("Invalid OTP", "email", req.Email)
		return httpx.BadRequest("无效验证码")
	}

	user := &repository.User{
		Username:  req.Username,
		Email:     req.Email,
		Role:      repository.RoleMember,
		Password:  hashedPassword,
		CreatedAt: time.Now(),
		LastLogin: time.Now(),
		Attr:      "{}",
	}
	err = s.userRepo.Save(user)
	if err != nil {
		if repository.IsUniqueConstraintViolation(err, "auth_user_username_key") {
			slog.Error("Username already exist")
			return httpx.Conflict("用户名已被占用")
		} else if repository.IsUniqueConstraintViolation(err, "auth_user_email_key") {
			slog.Error("Email already exist")
			return httpx.Conflict("邮箱已被占用")
		}
		slog.Error("Failed to save user", "error", err)
		return httpx.InternalError(err, "创建用户失败")
	}
	if err := s.otpRepo.DeleteOtp(repository.OtpVerify, req.Email, req.Otp); err != nil {
		slog.Warn("Failed to delete used OTP", "email", req.Email, "error", err)
	}

	s.eventRepo.Save(
		EventRegister,
		&struct {
			App        string `json:"app"`
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Ip         string `json:"ip"`
		}{
			App:        req.App,
			ActorUser:  user.Username,
			TargetUser: user.Username,
			Ip:         httpx.GetRealIp(r),
		},
	)

	return authn.RespondAuthTokens(w, authn.TokenOptions{
		App:              req.App,
		UserID:           user.ID,
		Username:         user.Username,
		Role:             user.Role,
		CreatedAt:        user.CreatedAt,
		WithRefreshToken: true,
	})
}

func (s *authService) Login(w http.ResponseWriter, r *http.Request) error {
	req, err := httpx.Body[struct {
		App      string `json:"app" label:"应用名" validate:"required"`
		Username string `json:"username" label:"用户名" validate:"required"`
		Password string `json:"password" label:"密码" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Login request body parse error", "error", err)
		return err
	}
	if _, err := authn.TokenPolicyForApp(req.App); err != nil {
		return err
	}

	var user *repository.User
	if strings.Contains(req.Username, "@") {
		user, err = s.userRepo.FindByEmail(req.Username)
		if err != nil {
			slog.Error("User lookup by email failed", "email", req.Username, "error", err)
			return httpx.InternalError(err, "查询用户失败")
		}
	}
	if user == nil {
		user, err = s.userRepo.FindByUsername(req.Username)
		if err != nil {
			slog.Error("User lookup by username failed", "username", req.Username, "error", err)
			return httpx.InternalError(err, "查询用户失败")
		}
	}
	if user == nil {
		slog.Error("User not found", "username", req.Username)
		return httpx.NotFound("用户不存在")
	}

	v, err := authn.ValidateHash(user.Password, req.Password)
	if !v.Valid || err != nil {
		slog.Error("Password validation failed", "username", user.Username, "error", err)
		return httpx.Unauthorized("密码错误")
	}
	if err := validateUserCanAuthenticate(user); err != nil {
		slog.Warn("User is not allowed to log in", "username", user.Username, "role", user.Role)
		return err
	}
	if v.Obsolete {
		newHashedPassword, err := authn.GenerateHash(req.Password)
		if err == nil {
			user.Password = newHashedPassword
			s.userRepo.UpdateHashedPassword(user)
		} else {
			slog.Warn("Failed to update password hash", "username", user.Username, "error", err)
		}
	}

	user.LastLogin = time.Now()
	s.userRepo.UpdateLastLogin(user)

	s.eventRepo.Save(
		EventLogin,
		&struct {
			App        string `json:"app"`
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Ip         string `json:"ip"`
		}{
			App:        req.App,
			ActorUser:  user.Username,
			TargetUser: user.Username,
			Ip:         httpx.GetRealIp(r),
		},
	)
	return authn.RespondAuthTokens(w, authn.TokenOptions{
		App:              req.App,
		UserID:           user.ID,
		Username:         user.Username,
		Role:             user.Role,
		CreatedAt:        user.CreatedAt,
		WithRefreshToken: true,
	})
}

func (s *authService) Refresh(w http.ResponseWriter, r *http.Request) error {
	app := r.URL.Query().Get("app")
	if _, err := authn.TokenPolicyForApp(app); err != nil {
		return err
	}

	username, err := authn.VerifyRefreshToken(r)
	if err != nil {
		return err
	}

	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		slog.Error("User lookup failed", "username", username, "error", err)
		return httpx.InternalError(err, "查询用户失败")
	}
	if user == nil {
		slog.Error("User not found", "username", username)
		return httpx.NotFound("用户不存在")
	}
	if err := validateUserCanAuthenticate(user); err != nil {
		slog.Warn("User is not allowed to refresh token", "username", user.Username, "role", user.Role)
		return err
	}

	user.LastLogin = time.Now()
	s.userRepo.UpdateLastLogin(user)

	return authn.RespondAuthTokens(w, authn.TokenOptions{
		App:              app,
		UserID:           user.ID,
		Username:         user.Username,
		Role:             user.Role,
		CreatedAt:        user.CreatedAt,
		WithRefreshToken: false,
	})
}

func (s *authService) Logout(w http.ResponseWriter, r *http.Request) error {
	username, err := authn.VerifyRefreshToken(r)
	if err != nil {
		slog.Error("Failed to verify refresh token", "error", err)
		return err
	}

	s.eventRepo.Save(
		EventLogout,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Ip         string `json:"ip"`
		}{
			ActorUser:  username,
			TargetUser: username,
			Ip:         httpx.GetRealIp(r),
		},
	)

	return authn.RespondLogout(w)
}

func (s *authService) sendOtpEmail(otpType string, email string, otp string) error {
	switch otpType {
	case repository.OtpVerify:
		return s.email.SendEmail(
			email,
			fmt.Sprintf(
				"%s 注册激活码",
				otp,
			),
			fmt.Sprintf(
				"您的注册激活码为 %s\n"+
					"激活码将会在15分钟后失效,请尽快完成注册\n"+
					"这是系统邮件，请勿回复",
				otp,
			),
		)
	case repository.OtpResetPassword:
		return s.email.SendEmail(
			email,
			"重置密码验证码",
			fmt.Sprintf(
				"您的重置密码验证码为 %s\n"+
					"验证码将会在15分钟后失效,请尽快完成操作\n"+
					"这是系统邮件，请勿回复",
				otp,
			),
		)
	default:
		return fmt.Errorf("未知的Otp类型: %s", otpType)
	}
}

func (s *authService) RequestOtp(w http.ResponseWriter, r *http.Request) error {
	req, err := httpx.Body[struct {
		Email string `json:"email" label:"邮箱" validate:"required,email"`
		Type  string `json:"type" label:"请求类型" validate:"required,oneof=verify reset_password"`
	}](r)
	if err != nil {
		slog.Error("Request OTP body parse error", "error", err)
		return err
	}
	settings := s.settingRepo.Get()
	if req.Type == repository.OtpVerify && !settings.RegisterEnabled {
		return httpx.Forbidden("注册功能已关闭")
	}
	if req.Type == repository.OtpResetPassword && !settings.ResetPasswordEnabled {
		return httpx.Forbidden("重置密码功能已关闭")
	}

	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		slog.Error("User lookup failed", "email", req.Email, "error", err)
		return httpx.InternalError(err, "邮件检查失败")
	}

	// 根据不同类型进行不同的验证
	switch req.Type {
	case repository.OtpVerify:
		if user != nil {
			slog.Error("Email already in use", "email", req.Email)
			return httpx.Conflict("邮箱已经被使用")
		}
	case repository.OtpResetPassword:
		if user == nil {
			slog.Error("User not found", "email", req.Email)
			return httpx.NotFound("用户不存在")
		}
	default:
		slog.Error("Invalid OTP request type", "type", req.Type)
		return httpx.BadRequest("无效的请求类型")
	}

	otp, err := s.otpRepo.SetOtp(req.Type, req.Email)
	if err != nil {
		slog.Error("Failed to create OTP", "email", req.Email, "error", err)
		return httpx.InternalError(err, "创建验证码失败")
	}

	err = s.sendOtpEmail(req.Type, req.Email, otp)
	if err != nil {
		slog.Error("Failed to send OTP email", "email", req.Email, "error", err)
		return httpx.InternalError(err, "发送验证邮件失败")
	}

	s.eventRepo.Save(
		EventOtp,
		&struct {
			Email string `json:"email"`
			Type  string `json:"type"`
			Ip    string `json:"ip"`
		}{
			Email: req.Email,
			Type:  req.Type,
			Ip:    httpx.GetRealIp(r),
		},
	)

	return httpx.RespondText(w, "验证邮件已发送")
}

func (s *authService) ResetPassword(w http.ResponseWriter, r *http.Request) error {
	settings := s.settingRepo.Get()
	if !settings.ResetPasswordEnabled {
		return httpx.Forbidden("重置密码功能已关闭")
	}

	req, err := httpx.Body[struct {
		Email    string `json:"email" label:"邮箱" validate:"required,email"`
		Otp      string `json:"otp" label:"验证码" validate:"required,len=26"`
		Password string `json:"password" label:"密码" validate:"required,min=8,max=100"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}
	if err := validatePassword(req.Password); err != nil {
		return err
	}

	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		slog.Error("User lookup failed", "email", req.Email, "error", err)
		return httpx.InternalError(err, "查询用户失败")
	}
	if user == nil {
		slog.Error("User not found", "email", req.Email)
		return httpx.NotFound("用户不存在")
	}

	newHashedPassword, err := authn.GenerateHash(req.Password)
	if err != nil {
		slog.Error("Failed to hash password", "email", req.Email, "error", err)
		return httpx.InternalError(err, "密码哈希失败")
	}

	validOtp, err := s.otpRepo.CheckOtp(repository.OtpResetPassword, req.Email, req.Otp)
	if err != nil {
		slog.Error("Failed to verify OTP", "email", req.Email, "error", err)
		return httpx.InternalError(err, "验证码校验失败")
	}
	if !validOtp {
		slog.Error("Invalid OTP", "email", req.Email)
		return httpx.Unauthorized("无效的验证码")
	}

	user.Password = newHashedPassword
	err = s.userRepo.UpdateHashedPassword(user)
	if err != nil {
		slog.Error("Failed to update password", "email", req.Email, "error", err)
		return httpx.InternalError(err, "密码重置失败")
	}
	if err := s.otpRepo.DeleteOtp(repository.OtpResetPassword, req.Email, req.Otp); err != nil {
		slog.Warn("Failed to delete used OTP", "email", req.Email, "error", err)
	}

	s.eventRepo.Save(
		EventResetPassword,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Ip         string `json:"ip"`
		}{
			ActorUser:  user.Username,
			TargetUser: user.Username,
			Ip:         httpx.GetRealIp(r),
		},
	)

	return httpx.RespondText(w, "密码重置成功")
}
