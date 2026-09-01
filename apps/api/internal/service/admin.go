package service

import (
	"auth/internal/authn"
	"auth/internal/httpx"
	"auth/internal/repository"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"
	_ "time/tzdata"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

const (
	OverviewStatsMaxDays  int    = 30
	OverviewStatsTimezone string = "Asia/Shanghai"
)

const (
	EventTrustUser      string = "trust-user"
	EventUntrustUser    string = "untrust-user"
	EventRestrictUser   string = "restrict-user"
	EventUnrestrictUser string = "unrestrict-user"
	EventBanUser        string = "ban-user"
	EventUnbanUser      string = "unban-user"
	EventUpdateSetting  string = "update-setting"
)

type AdminService interface {
	Use(chi.Router)
	GetOverviewActivity(http.ResponseWriter, *http.Request) error
	GetOverviewUserSummary(http.ResponseWriter, *http.Request) error
	GetUser(http.ResponseWriter, *http.Request) error
	TrustUser(http.ResponseWriter, *http.Request) error
	UntrustUser(http.ResponseWriter, *http.Request) error
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
	router.Get("/overview", httpx.EH(s.GetOverviewActivity))
	router.Get("/overview/activity", httpx.EH(s.GetOverviewActivity))
	router.Get("/overview/user-summary", httpx.EH(s.GetOverviewUserSummary))
	router.Get("/user", httpx.EH(s.GetUser))
	router.Post("/user/trust", httpx.EH(s.TrustUser))
	router.Post("/user/untrust", httpx.EH(s.UntrustUser))
	router.Post("/user/restrict", httpx.EH(s.RestrictUser))
	router.Post("/user/unrestrict", httpx.EH(s.UnrestrictUser))
	router.Post("/user/ban", httpx.EH(s.BanUser))
	router.Post("/user/unban", httpx.EH(s.UnbanUser))
	router.Get("/event", httpx.EH(s.GetEvent))
	router.Get("/setting", httpx.EH(s.GetSetting))
	router.Post("/setting", httpx.EH(s.UpdateSetting))
}

type PageResponse[T any] struct {
	Total int64 `json:"total"`
	Items []T   `json:"items"`
}

const (
	defaultPageSize int64 = 50
	maxPageSize     int64 = 100
)

type UserResponse struct {
	ID        int64           `json:"id"`
	Username  string          `json:"username"`
	Email     string          `json:"email"`
	Role      string          `json:"role"`
	CreatedAt time.Time       `json:"createdAt"`
	LastLogin time.Time       `json:"lastLogin"`
	Attr      json.RawMessage `json:"attr"`
}

type EventResponse struct {
	ID        int64           `json:"id"`
	Action    string          `json:"action"`
	Detail    json.RawMessage `json:"detail"`
	CreatedAt time.Time       `json:"createdAt"`
}

func jsonObject(value string) json.RawMessage {
	var object map[string]json.RawMessage
	if err := json.Unmarshal([]byte(value), &object); err != nil || object == nil {
		return json.RawMessage(`{}`)
	}
	return json.RawMessage(value)
}

type DailyAuthStatResponse struct {
	Date          string `json:"date"`
	LoginCount    int64  `json:"loginCount"`
	RegisterCount int64  `json:"registerCount"`
}

type AuthActivitySummaryResponse struct {
	LoginCount int64 `json:"loginCount"`
	NewUsers   int64 `json:"newUsers"`
}

type OverviewActivityResponse struct {
	AuthActivity    []DailyAuthStatResponse     `json:"authActivity"`
	Summary         AuthActivitySummaryResponse `json:"summary"`
	PreviousSummary AuthActivitySummaryResponse `json:"previousSummary"`
}

type OverviewUserSummaryResponse struct {
	TotalUsers      int64 `json:"totalUsers"`
	RestrictedUsers int64 `json:"restrictedUsers"`
	BannedUsers     int64 `json:"bannedUsers"`
}

func authActivitySummary(stats []repository.DailyAuthStat) AuthActivitySummaryResponse {
	var summary AuthActivitySummaryResponse
	for _, stat := range stats {
		summary.LoginCount += stat.LoginCount
	}
	return summary
}

func (s *adminService) GetOverviewActivity(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	startDateValue := query.Get("start_date")
	endDateValue := query.Get("end_date")
	if startDateValue == "" || endDateValue == "" {
		return httpx.BadRequest("必须提供 start_date 和 end_date")
	}

	location, err := time.LoadLocation(OverviewStatsTimezone)
	if err != nil {
		slog.Error("Failed to load overview statistics timezone", "timezone", OverviewStatsTimezone, "error", err)
		return httpx.InternalError(err, "无法加载统计时区")
	}
	startDate, err := time.ParseInLocation(time.DateOnly, startDateValue, location)
	if err != nil {
		return httpx.BadRequest("start_date 必须使用 YYYY-MM-DD 格式")
	}
	endDate, err := time.ParseInLocation(time.DateOnly, endDateValue, location)
	if err != nil {
		return httpx.BadRequest("end_date 必须使用 YYYY-MM-DD 格式")
	}
	if endDate.Before(startDate) {
		return httpx.BadRequest("end_date 不能早于 start_date")
	}
	if endDate.After(startDate.AddDate(0, 0, OverviewStatsMaxDays-1)) {
		return httpx.BadRequest("时间范围不能超过 30 天")
	}

	stats, err := s.eventRepo.DailyAuthStats(startDate, endDate, OverviewStatsTimezone)
	if err != nil {
		slog.Error("Failed to get daily authentication statistics", "error", err)
		return httpx.InternalError(err, "查询认证统计失败")
	}
	days := 1
	for day := startDate; day.Before(endDate); day = day.AddDate(0, 0, 1) {
		days++
	}
	previousEndDate := startDate.AddDate(0, 0, -1)
	previousStartDate := startDate.AddDate(0, 0, -days)
	previousStats, err := s.eventRepo.DailyAuthStats(
		previousStartDate,
		previousEndDate,
		OverviewStatsTimezone,
	)
	if err != nil {
		slog.Error("Failed to get previous authentication statistics", "error", err)
		return httpx.InternalError(err, "查询上一周期认证统计失败")
	}
	newUsers, err := s.userRepo.CountCreated(
		startDate,
		endDate.AddDate(0, 0, 1),
	)
	if err != nil {
		slog.Error("Failed to count new users", "error", err)
		return httpx.InternalError(err, "查询新增用户统计失败")
	}
	previousNewUsers, err := s.userRepo.CountCreated(
		previousStartDate,
		previousEndDate.AddDate(0, 0, 1),
	)
	if err != nil {
		slog.Error("Failed to count previous new users", "error", err)
		return httpx.InternalError(err, "查询上一周期新增用户统计失败")
	}

	summary := authActivitySummary(stats)
	summary.NewUsers = newUsers
	previousSummary := authActivitySummary(previousStats)
	previousSummary.NewUsers = previousNewUsers
	response := OverviewActivityResponse{
		AuthActivity:    make([]DailyAuthStatResponse, len(stats)),
		Summary:         summary,
		PreviousSummary: previousSummary,
	}
	for i, stat := range stats {
		response.AuthActivity[i] = DailyAuthStatResponse{
			Date:          stat.Date.Format(time.DateOnly),
			LoginCount:    stat.LoginCount,
			RegisterCount: stat.RegisterCount,
		}
	}
	render.JSON(w, r, response)
	return nil
}

func (s *adminService) GetOverviewUserSummary(w http.ResponseWriter, r *http.Request) error {
	summary, err := s.userRepo.Summary()
	if err != nil {
		slog.Error("Failed to get overview user summary", "error", err)
		return httpx.InternalError(err, "查询用户概览失败")
	}
	render.JSON(w, r, OverviewUserSummaryResponse{
		TotalUsers:      summary.TotalUsers,
		RestrictedUsers: summary.RestrictedUsers,
		BannedUsers:     summary.BannedUsers,
	})
	return nil
}

func (s *adminService) GetUser(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	timeRange, err := httpx.ParseTimeRange(query)
	if err != nil {
		return err
	}
	filter := repository.UserFilter{
		Query:         query.Get("q"),
		Role:          query.Get("role"),
		CreatedAfter:  timeRange.After,
		CreatedBefore: timeRange.Before,
	}
	pagination, err := httpx.ParsePagination(query, defaultPageSize, maxPageSize)
	if err != nil {
		return err
	}

	usersCount, err := s.userRepo.Count(filter)
	if err != nil {
		slog.Error("Failed to count users", "error", err)
		return httpx.InternalError(err, "查询用户失败")
	}

	users, err := s.userRepo.List(filter, pagination.Limit, pagination.Offset)
	if err != nil {
		slog.Error("Failed to list users", "error", err)
		return httpx.InternalError(err, "查询用户失败")
	}

	userPage := PageResponse[UserResponse]{
		Total: usersCount,
		Items: make([]UserResponse, len(users)),
	}
	for i, user := range users {
		userPage.Items[i] = UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
			LastLogin: user.LastLogin,
			Attr:      jsonObject(user.Attr),
		}
	}
	render.JSON(w, r, userPage)
	return nil
}

func (s *adminService) TrustUser(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		Username string `json:"username" label:"用户名" validate:"required"`
		Reason   string `json:"reason" label:"原因" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return httpx.NotFound("用户不存在")
	}
	if user == nil {
		return httpx.NotFound("用户不存在")
	}
	if user.Role != repository.RoleMember {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return httpx.Unauthorized("只能将普通用户设为可信用户")
	}

	user.Role = repository.RoleTrusted
	if err := s.userRepo.UpdateRole(user); err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return httpx.InternalError(err, "更新用户角色失败")
	}

	s.eventRepo.Save(
		EventTrustUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  principal.Username,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) UntrustUser(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		Username string `json:"username" label:"用户名" validate:"required"`
		Reason   string `json:"reason" label:"原因" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return httpx.NotFound("用户不存在")
	}
	if user == nil {
		return httpx.NotFound("用户不存在")
	}
	if user.Role != repository.RoleTrusted {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return httpx.Unauthorized("只能取消可信用户的可信状态")
	}

	user.Role = repository.RoleMember
	if err := s.userRepo.UpdateRole(user); err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return httpx.InternalError(err, "更新用户角色失败")
	}

	s.eventRepo.Save(
		EventUntrustUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  principal.Username,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) RestrictUser(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		Username string `json:"username" label:"用户名" validate:"required"`
		Reason   string `json:"reason" label:"原因" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return httpx.NotFound("用户不存在")
	}
	if user.Role != repository.RoleMember {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return httpx.Unauthorized("没有权限对非普通用户进行操作")
	}

	user.Role = repository.RoleRestricted
	err = s.userRepo.UpdateRole(user)
	if err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return httpx.InternalError(err, "更新用户角色失败")
	}

	s.eventRepo.Save(
		EventRestrictUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  principal.Username,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) BanUser(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		Username string `json:"username" label:"用户名" validate:"required"`
		Reason   string `json:"reason" label:"原因" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return httpx.NotFound("用户不存在")
	}
	if user.Role != repository.RoleMember {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return httpx.Unauthorized("没有权限对非普通用户进行操作")
	}

	user.Role = repository.RoleBanned
	err = s.userRepo.UpdateRole(user)
	if err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return httpx.InternalError(err, "更新用户角色失败")
	}

	s.eventRepo.Save(
		EventBanUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  principal.Username,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) UnrestrictUser(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		Username string `json:"username" label:"用户名" validate:"required"`
		Reason   string `json:"reason" label:"原因" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return httpx.NotFound("用户不存在")
	}
	if user.Role != repository.RoleRestricted {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return httpx.Unauthorized("只能取消受限用户的限制")
	}

	user.Role = repository.RoleMember
	if err := s.userRepo.UpdateRole(user); err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return httpx.InternalError(err, "更新用户角色失败")
	}

	s.eventRepo.Save(
		EventUnrestrictUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  principal.Username,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) UnbanUser(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		Username string `json:"username" label:"用户名" validate:"required"`
		Reason   string `json:"reason" label:"原因" validate:"required"`
	}](r)
	if err != nil {
		slog.Error("Request body parse error", "error", err)
		return err
	}

	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		slog.Error("User lookup failed", "username", req.Username, "error", err)
		return httpx.NotFound("用户不存在")
	}
	if user.Role != repository.RoleBanned {
		slog.Error("Unauthorized role change attempt", "username", req.Username, "current_role", user.Role)
		return httpx.Unauthorized("只能取消已封禁用户的封禁")
	}

	user.Role = repository.RoleMember
	if err := s.userRepo.UpdateRole(user); err != nil {
		slog.Error("Failed to update user role", "username", user.Username, "error", err)
		return httpx.InternalError(err, "更新用户角色失败")
	}

	s.eventRepo.Save(
		EventUnbanUser,
		&struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{
			ActorUser:  principal.Username,
			TargetUser: user.Username,
			Reason:     req.Reason,
		},
	)

	return nil
}

func (s *adminService) GetEvent(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	actions := make([]string, 0, len(query["action"]))
	for _, action := range query["action"] {
		if action = strings.TrimSpace(action); action != "" {
			actions = append(actions, action)
		}
	}
	timeRange, err := httpx.ParseTimeRange(query)
	if err != nil {
		return err
	}
	filter := repository.EventFilter{
		ActorUser:     query.Get("actor_user"),
		TargetUser:    query.Get("target_user"),
		Actions:       actions,
		CreatedAfter:  timeRange.After,
		CreatedBefore: timeRange.Before,
	}
	pagination, err := httpx.ParsePagination(query, defaultPageSize, maxPageSize)
	if err != nil {
		return err
	}

	eventsCount, err := s.eventRepo.Count(filter)
	if err != nil {
		slog.Error("Failed to count events", "error", err)
		return httpx.InternalError(err, "查询事件失败")
	}

	events, err := s.eventRepo.List(filter, pagination.Limit, pagination.Offset)
	if err != nil {
		slog.Error("Failed to list events", "error", err)
		return httpx.InternalError(err, "查询事件失败")
	}

	eventPage := PageResponse[EventResponse]{
		Total: eventsCount,
		Items: make([]EventResponse, len(events)),
	}
	for i, event := range events {
		eventPage.Items[i] = EventResponse{
			ID:        event.ID,
			Action:    event.Action,
			Detail:    jsonObject(event.Detail),
			CreatedAt: event.CreatedAt,
		}
	}
	render.JSON(w, r, eventPage)
	return nil
}

func (s *adminService) GetSetting(w http.ResponseWriter, r *http.Request) error {
	settings := s.settingRepo.Get()
	render.JSON(w, r, settings)
	return nil
}

func (s *adminService) UpdateSetting(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}

	req, err := httpx.Body[struct {
		RegisterEnabled      *bool `json:"registerEnabled" label:"注册功能" validate:"required"`
		ResetPasswordEnabled *bool `json:"resetPasswordEnabled" label:"重置密码功能" validate:"required"`
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
		return httpx.InternalError(err, "更新认证设置失败")
	}

	s.eventRepo.Save(
		EventUpdateSetting,
		&struct {
			ActorUser            string `json:"actor_user"`
			RegisterEnabled      bool   `json:"register_enabled"`
			ResetPasswordEnabled bool   `json:"reset_password_enabled"`
		}{
			ActorUser:            principal.Username,
			RegisterEnabled:      settings.RegisterEnabled,
			ResetPasswordEnabled: settings.ResetPasswordEnabled,
		},
	)

	render.JSON(w, r, settings)
	return nil
}
