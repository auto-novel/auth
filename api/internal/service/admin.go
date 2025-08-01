package service

import (
	"auth/internal/repository"
	"auth/internal/util"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

const (
	EventRestrictUser string = "restrict-user"
	EventBanUser      string = "ban-user"
)

type AdminService interface {
	Use(chi.Router)
	GetUser(http.ResponseWriter, *http.Request) error
	RestrictUser(http.ResponseWriter, *http.Request) error
	BanUser(http.ResponseWriter, *http.Request) error
}

type adminService struct {
	userRepo  repository.UserRepository
	eventRepo repository.EventRepository
}

func NewAdminService(
	userRepo repository.UserRepository,
	eventRepo repository.EventRepository,
) AdminService {
	s := &adminService{
		userRepo:  userRepo,
		eventRepo: eventRepo,
	}
	return s
}

func (s *adminService) Use(router chi.Router) {
	router.Get("/user", util.EH(s.GetUser))
	router.Post("/user/restrict", util.EH(s.RestrictUser))
	router.Post("/user/ban", util.EH(s.BanUser))
}

func (s *adminService) GetUser(w http.ResponseWriter, r *http.Request) error {
	_, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}
	users, err := s.userRepo.List(repository.UserFilter{}, 0, 10)
	if err != nil {
		slog.Error("Failed to list users", "error", err)
		return err
	}
	return util.RespondJson(w, users)
}

func (s *adminService) RestrictUser(w http.ResponseWriter, r *http.Request) error {
	adminUsername, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}

	req, err := util.Body[struct {
		Username string `json:"username" validate:"required"`
		Reason   string `json:"reason" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return util.NotFound("用户不存在")
	}
	if user.Role != repository.RoleMember {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return util.Unauthorized("没有权限对非普通用户进行操作")
	}

	user.Role = repository.RoleRestricted
	err = s.userRepo.UpdateRole(user)
	if err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return util.InternalServerError("更新用户角色失败")
	}

	s.eventRepo.Save(
		EventRestrictUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  adminUsername,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) BanUser(w http.ResponseWriter, r *http.Request) error {
	adminUsername, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}

	req, err := util.Body[struct {
		Username string `json:"username" validate:"required"`
		Reason   string `json:"reason" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return util.NotFound("用户不存在")
	}
	if user.Role != repository.RoleMember {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return util.Unauthorized("没有权限对非普通用户进行操作")
	}

	user.Role = repository.RoleBanned
	err = s.userRepo.UpdateRole(user)
	if err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return util.InternalServerError("更新用户角色失败")
	}

	s.eventRepo.Save(
		EventBanUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  adminUsername,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}
