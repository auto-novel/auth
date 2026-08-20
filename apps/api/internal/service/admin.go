package service

import (
	"auth/internal/repository"
	"auth/internal/util"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

const (
	EventRestrictUser string = "restrict-user"
	EventBanUser      string = "ban-user"
	EventStrikeUser   string = "strike-user"
)

type AdminService interface {
	Use(chi.Router)
	GetUser(http.ResponseWriter, *http.Request) error
	RestrictUser(http.ResponseWriter, *http.Request) error
	BanUser(http.ResponseWriter, *http.Request) error
	StrikeUser(http.ResponseWriter, *http.Request) error
	GetEvent(http.ResponseWriter, *http.Request) error
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
	router.Post("/user/strike", util.EH(s.StrikeUser))
	router.Get("/event", util.EH(s.GetEvent))
}

type PageResponse[T any] struct {
	Total int64 `json:"total"`
	Items []T   `json:"items"`
}

type UserResponse struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	CreatedAt int64  `json:"createdAt"`
	LastLogin int64  `json:"lastLogin"`
	Attr      string `json:"attr"`
}

type EventResponse struct {
	ID        int64     `json:"id"`
	Action    string    `json:"action"`
	Detail    string    `json:"detail"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *adminService) GetUser(w http.ResponseWriter, r *http.Request) error {
	_, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}
	query := r.URL.Query()
	filter := repository.UserFilter{
		Query:         query.Get("q"),
		Role:          query.Get("role"),
		CreatedAfter:  util.GetQueryAsTime(query, "created_after", time.Time{}),
		CreatedBefore: util.GetQueryAsTime(query, "created_before", time.Time{}),
	}
	page := util.GetQueryAsInt(query, "page", 1)
	pageSize := util.GetQueryAsInt(query, "page_size", 50)

	usersCount, err := s.userRepo.Count(filter)
	if err != nil {
		slog.Error("Failed to count users", "error", err)
		return err
	}

	users, err := s.userRepo.List(filter, pageSize, (page-1)*pageSize)
	if err != nil {
		slog.Error("Failed to list users", "error", err)
		return err
	}

	userPage := PageResponse[UserResponse]{
		Total: usersCount,
		Items: make([]UserResponse, len(users)),
	}
	for i, user := range users {
		userPage.Items[i] = UserResponse{
			ID:        user.ID,
			Name:      user.Username,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt.UnixMilli(),
			LastLogin: user.LastLogin.UnixMilli(),
			Attr:      user.Attr,
		}
	}
	return util.RespondJson(w, userPage)
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

func (s *adminService) StrikeUser(w http.ResponseWriter, r *http.Request) error {
	adminUsername, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}

	req, err := util.Body[struct {
		Username string `json:"username" validate:"required"`
		Reason   string `json:"reason" validate:"required"`
		Evidence string `json:"evidence" validate:"required"`
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

	s.eventRepo.Save(
		EventRestrictUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
			Evidence   string `json:"evidence"`
		}{
			ActorUser:  adminUsername,
			TargetUser: user.Username,
			Reason:     req.Reason,
			Evidence:   req.Evidence,
		},
	)

	const StrikePeriod = 100 * 24 * time.Hour // 100 days
	const MaxStrikes = 3
	recentStrikes, err := s.eventRepo.List(repository.EventFilter{
		TargetUser:   req.Username,
		Action:       EventRestrictUser,
		CreatedAfter: time.Now().Add(-StrikePeriod),
	}, 0, 3)
	if err != nil {
		slog.Error("Failed to list recent strikes", "username", req.Username, "error", err)
		return util.InternalServerError("查询用户违规记录失败")
	}

	if len(recentStrikes) >= MaxStrikes {
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
				Reason:     "三振出局",
			},
		)
	}

	return nil
}

func (s *adminService) GetEvent(w http.ResponseWriter, r *http.Request) error {
	_, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}
	query := r.URL.Query()
	filter := repository.EventFilter{
		ActorUser:     query.Get("actor_user"),
		TargetUser:    query.Get("target_user"),
		Action:        query.Get("action"),
		CreatedAfter:  util.GetQueryAsTime(query, "created_after", time.Time{}),
		CreatedBefore: util.GetQueryAsTime(query, "created_before", time.Time{}),
	}
	page := util.GetQueryAsInt(query, "page", 1)
	pageSize := util.GetQueryAsInt(query, "page_size", 50)

	eventsCount, err := s.eventRepo.Count(filter)
	if err != nil {
		slog.Error("Failed to count events", "error", err)
		return err
	}

	events, err := s.eventRepo.List(filter, pageSize, (page-1)*pageSize)
	if err != nil {
		slog.Error("Failed to list events", "error", err)
		return err
	}

	eventPage := PageResponse[EventResponse]{
		Total: eventsCount,
		Items: make([]EventResponse, len(events)),
	}
	for i, event := range events {
		eventPage.Items[i] = EventResponse{
			ID:        event.ID,
			Action:    event.Action,
			Detail:    event.Detail,
			CreatedAt: event.CreatedAt,
		}
	}
	return util.RespondJson(w, eventPage)
}
