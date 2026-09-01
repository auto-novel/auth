package me

import (
	"auth/internal/authn"
	"auth/internal/httpx"
	"auth/internal/repository"
	"auth/internal/service"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

type MeService interface {
	Use(chi.Router)
	GetStrikes(http.ResponseWriter, *http.Request) error
}

type MeStrikeResponse struct {
	ID        int64      `json:"id"`
	Reason    string     `json:"reason"`
	Evidence  string     `json:"evidence"`
	Point     int16      `json:"point"`
	CreatedAt time.Time  `json:"createdAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
}

type meService struct {
	userRepo   repository.UserRepository
	strikeRepo repository.StrikeRepository
}

func NewMeService(userRepo repository.UserRepository, strikeRepo repository.StrikeRepository) MeService {
	return &meService{userRepo: userRepo, strikeRepo: strikeRepo}
}

func (s *meService) Use(router chi.Router) {
	router.Get("/strikes", httpx.EH(s.GetStrikes))
}

func (s *meService) GetStrikes(w http.ResponseWriter, r *http.Request) error {
	principal, err := authn.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}
	user, err := s.userRepo.FindByUsername(principal.Username)
	if err != nil {
		slog.Error("Current user lookup failed", "username", principal.Username, "error", err)
		return httpx.InternalError(err, "查询当前用户失败")
	}
	if user == nil {
		return httpx.Unauthorized("当前用户不存在")
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
	total, err := s.strikeRepo.Count(filter)
	if err != nil {
		return httpx.InternalError(err, "查询违规记录失败")
	}
	records, err := s.strikeRepo.List(filter, limit, offset)
	if err != nil {
		return httpx.InternalError(err, "查询违规记录失败")
	}
	response := service.PageResponse[MeStrikeResponse]{
		Total: total,
		Items: make([]MeStrikeResponse, len(records)),
	}
	for i, record := range records {
		response.Items[i] = MeStrikeResponse{
			ID:        record.ID,
			Reason:    record.Reason,
			Evidence:  record.Evidence,
			Point:     record.Point,
			CreatedAt: record.CreatedAt,
			RevokedAt: record.RevokedAt,
		}
	}
	render.JSON(w, r, response)
	return nil
}
