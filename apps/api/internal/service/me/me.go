package me

import (
	"auth/internal/httpx"
	"auth/internal/repository"
	"auth/internal/service"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

type MeStrikeResponse struct {
	ID        int64      `json:"id"`
	Reason    string     `json:"reason"`
	Evidence  string     `json:"evidence"`
	Point     int16      `json:"point"`
	CreatedAt time.Time  `json:"createdAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
}

type MeStrikePageResponse struct {
	service.PageResponse[MeStrikeResponse]
	LatestStrikeID int64 `json:"latestStrikeId"`
}

type StrikeReadStateResponse struct {
	HasUnread bool `json:"hasUnread"`
}

type AttentionStatusResponse struct {
	Strikes StrikeReadStateResponse `json:"strikes"`
}

type UpdateStrikeReadStateRequest struct {
	ThroughID *int64 `json:"throughId" validate:"required,gte=0" label:"已读处罚 ID"`
}

type meService struct {
	userRepo   repository.UserRepository
	strikeRepo repository.StrikeRepository
}

func NewMeService(userRepo repository.UserRepository, strikeRepo repository.StrikeRepository) *meService {
	return &meService{userRepo: userRepo, strikeRepo: strikeRepo}
}

func (s *meService) Use(router chi.Router) {
	router.Get("/attention-status", httpx.EH(s.GetAttentionStatus))
	router.Get("/strikes", httpx.EH(s.GetStrikes))
	router.Put("/strikes/read-state", httpx.EH(s.UpdateStrikeReadState))
}

func (s *meService) currentUser(r *http.Request) (*repository.User, error) {
	principal, err := httpx.AuthenticatedPrincipal(r)
	if err != nil {
		return nil, err
	}
	user, err := s.userRepo.FindByUsername(principal.Username)
	if err != nil {
		slog.Error("Current user lookup failed", "username", principal.Username, "error", err)
		return nil, httpx.InternalError(err, "查询当前用户失败")
	}
	if user == nil {
		return nil, httpx.Unauthorized("当前用户不存在")
	}

	return user, nil
}

func (s *meService) GetStrikes(w http.ResponseWriter, r *http.Request) error {
	user, err := s.currentUser(r)
	if err != nil {
		return err
	}

	query := r.URL.Query()
	timeRange, err := service.ParseTimeRange(query)
	if err != nil {
		return err
	}
	filter := repository.StrikeFilter{
		UserID:        user.ID,
		CreatedAfter:  timeRange.After,
		CreatedBefore: timeRange.Before,
	}
	page, err := service.ParsePage(query, service.DefaultPageSize, service.MaxPageSize)
	if err != nil {
		return err
	}
	return s.respondStrikes(w, r, filter, page.Limit, page.Offset)
}

func (s *meService) respondStrikes(w http.ResponseWriter, r *http.Request, filter repository.StrikeFilter, limit, offset int64) error {
	page, err := s.strikeRepo.ListMyStrikes(r.Context(), filter, limit, offset)
	if err != nil {
		return httpx.InternalError(err, "查询违规记录失败")
	}
	response := MeStrikePageResponse{
		PageResponse: service.PageResponse[MeStrikeResponse]{
			Total: page.Total,
			Items: make([]MeStrikeResponse, len(page.Items)),
		},
		LatestStrikeID: page.LatestStrikeID,
	}
	for i, record := range page.Items {
		response.Items[i] = MeStrikeResponse{
			ID:        record.ID,
			Reason:    record.Reason,
			Evidence:  record.Evidence,
			Point:     record.Point,
			CreatedAt: record.CreatedAt,
			RevokedAt: record.RevokedAt,
		}
	}
	w.Header().Set("Cache-Control", "no-store")
	render.JSON(w, r, response)
	return nil
}

func (s *meService) GetAttentionStatus(w http.ResponseWriter, r *http.Request) error {
	user, err := s.currentUser(r)
	if err != nil {
		return err
	}
	unread, err := s.strikeRepo.HasUnreadStrikes(r.Context(), user.ID)
	if err != nil {
		return httpx.InternalError(err, "查询处罚提醒失败")
	}
	w.Header().Set("Cache-Control", "no-store")
	render.JSON(w, r, AttentionStatusResponse{
		Strikes: StrikeReadStateResponse{HasUnread: unread},
	})
	return nil
}

func (s *meService) UpdateStrikeReadState(w http.ResponseWriter, r *http.Request) error {
	user, err := s.currentUser(r)
	if err != nil {
		return err
	}
	body, err := httpx.Body[UpdateStrikeReadStateRequest](r)
	if err != nil {
		return err
	}
	unread, err := s.strikeRepo.MarkStrikesRead(r.Context(), user.ID, *body.ThroughID)
	if errors.Is(err, repository.ErrInvalidStrikeRead) {
		return httpx.BadRequest("已读处罚 ID 无效")
	}
	if err != nil {
		return httpx.InternalError(err, "标记处罚已读失败")
	}
	w.Header().Set("Cache-Control", "no-store")
	render.JSON(w, r, StrikeReadStateResponse{HasUnread: unread})
	return nil
}
