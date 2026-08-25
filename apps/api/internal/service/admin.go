package service

import (
	"auth/internal/repository"
	"auth/internal/util"
	"log/slog"
	"net/http"
	"time"
	_ "time/tzdata"

	"github.com/go-chi/chi/v5"
)

const (
	OverviewStatsMaxDays  int    = 30
	OverviewStatsTimezone string = "Asia/Shanghai"
)

const (
	EventRestrictUser   string = "restrict-user"
	EventUnrestrictUser string = "unrestrict-user"
	EventBanUser        string = "ban-user"
	EventUnbanUser      string = "unban-user"
	EventUpdateSetting  string = "update-setting"
)

type AdminService interface {
	Use(chi.Router)
	GetOverview(http.ResponseWriter, *http.Request) error
	GetUser(http.ResponseWriter, *http.Request) error
	RestrictUser(http.ResponseWriter, *http.Request) error
	UnrestrictUser(http.ResponseWriter, *http.Request) error
	BanUser(http.ResponseWriter, *http.Request) error
	UnbanUser(http.ResponseWriter, *http.Request) error
	GetEvent(http.ResponseWriter, *http.Request) error
	GetSetting(http.ResponseWriter, *http.Request) error
	UpdateSetting(http.ResponseWriter, *http.Request) error
}

type adminService struct {
	userRepo    repository.UserRepository
	eventRepo   repository.EventRepository
	settingRepo repository.SettingRepository
}

func NewAdminService(
	userRepo repository.UserRepository,
	eventRepo repository.EventRepository,
	settingRepo repository.SettingRepository,
) AdminService {
	s := &adminService{
		userRepo:    userRepo,
		eventRepo:   eventRepo,
		settingRepo: settingRepo,
	}
	return s
}

func (s *adminService) Use(router chi.Router) {
	router.Get("/overview", util.EH(s.GetOverview))
	router.Get("/user", util.EH(s.GetUser))
	router.Post("/user/restrict", util.EH(s.RestrictUser))
	router.Post("/user/unrestrict", util.EH(s.UnrestrictUser))
	router.Post("/user/ban", util.EH(s.BanUser))
	router.Post("/user/unban", util.EH(s.UnbanUser))
	router.Get("/event", util.EH(s.GetEvent))
	router.Get("/setting", util.EH(s.GetSetting))
	router.Post("/setting", util.EH(s.UpdateSetting))
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

type DailyAuthStatResponse struct {
	Date          string `json:"date"`
	LoginCount    int64  `json:"loginCount"`
	RegisterCount int64  `json:"registerCount"`
}

type OverviewResponse struct {
	AuthActivity []DailyAuthStatResponse `json:"authActivity"`
}

func (s *adminService) GetOverview(w http.ResponseWriter, r *http.Request) error {
	_, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}

	query := r.URL.Query()
	startDateValue := query.Get("start_date")
	endDateValue := query.Get("end_date")
	if startDateValue == "" || endDateValue == "" {
		return util.BadRequest("必须提供 start_date 和 end_date")
	}

	location, err := time.LoadLocation(OverviewStatsTimezone)
	if err != nil {
		slog.Error("Failed to load overview statistics timezone", "timezone", OverviewStatsTimezone, "error", err)
		return util.InternalServerError("无法加载统计时区")
	}
	startDate, err := time.ParseInLocation(time.DateOnly, startDateValue, location)
	if err != nil {
		return util.BadRequest("start_date 必须使用 YYYY-MM-DD 格式")
	}
	endDate, err := time.ParseInLocation(time.DateOnly, endDateValue, location)
	if err != nil {
		return util.BadRequest("end_date 必须使用 YYYY-MM-DD 格式")
	}
	if endDate.Before(startDate) {
		return util.BadRequest("end_date 不能早于 start_date")
	}
	if endDate.After(startDate.AddDate(0, 0, OverviewStatsMaxDays-1)) {
		return util.BadRequest("时间范围不能超过 30 天")
	}

	stats, err := s.eventRepo.DailyAuthStats(startDate, endDate, OverviewStatsTimezone)
	if err != nil {
		slog.Error("Failed to get daily authentication statistics", "error", err)
		return err
	}

	response := OverviewResponse{
		AuthActivity: make([]DailyAuthStatResponse, len(stats)),
	}
	for i, stat := range stats {
		response.AuthActivity[i] = DailyAuthStatResponse{
			Date:          stat.Date.Format(time.DateOnly),
			LoginCount:    stat.LoginCount,
			RegisterCount: stat.RegisterCount,
		}
	}
	return util.RespondJson(w, response)
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

func (s *adminService) UnrestrictUser(w http.ResponseWriter, r *http.Request) error {
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
	if user.Role != repository.RoleRestricted {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return util.Unauthorized("只能取消受限用户的限制")
	}

	user.Role = repository.RoleMember
	if err := s.userRepo.UpdateRole(user); err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return util.InternalServerError("更新用户角色失败")
	}

	s.eventRepo.Save(
		EventUnrestrictUser,
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

func (s *adminService) UnbanUser(w http.ResponseWriter, r *http.Request) error {
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
	if user.Role != repository.RoleBanned {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return util.Unauthorized("只能取消已封禁用户的封禁")
	}

	user.Role = repository.RoleMember
	if err := s.userRepo.UpdateRole(user); err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return util.InternalServerError("更新用户角色失败")
	}

	s.eventRepo.Save(
		EventUnbanUser,
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

func (s *adminService) GetSetting(w http.ResponseWriter, r *http.Request) error {
	_, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}

	settings := s.settingRepo.Get()
	return util.RespondJson(w, settings)
}

func (s *adminService) UpdateSetting(w http.ResponseWriter, r *http.Request) error {
	adminUsername, err := util.VerifyAccessToken(r, true)
	if err != nil {
		slog.Error("Access token verification failed", "error", err)
		return err
	}

	req, err := util.Body[struct {
		RegisterEnabled      *bool `json:"registerEnabled" validate:"required"`
		ResetPasswordEnabled *bool `json:"resetPasswordEnabled" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Setting request body parse error", "error", err)
		return err
	}

	settings, err := s.settingRepo.Update(repository.AuthSettings{
		RegisterEnabled:      *req.RegisterEnabled,
		ResetPasswordEnabled: *req.ResetPasswordEnabled,
	})
	if err != nil {
		slog.Error("Failed to update auth settings", "error", err)
		return util.InternalServerError("更新认证设置失败")
	}

	s.eventRepo.Save(
		EventUpdateSetting,
		&struct {
			ActorUser            string `json:"actor_user"`
			RegisterEnabled      bool   `json:"register_enabled"`
			ResetPasswordEnabled bool   `json:"reset_password_enabled"`
		}{
			ActorUser:            adminUsername,
			RegisterEnabled:      settings.RegisterEnabled,
			ResetPasswordEnabled: settings.ResetPasswordEnabled,
		},
	)

	return util.RespondJson(w, settings)
}
