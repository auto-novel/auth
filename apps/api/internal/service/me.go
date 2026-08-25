package service

import (
	"auth/internal/repository"
	"auth/internal/util"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
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
	router.Get("/strikes", util.EH(s.GetStrikes))
}

func (s *meService) GetStrikes(w http.ResponseWriter, r *http.Request) error {
	principal, err := util.AuthenticatedPrincipal(r)
	if err != nil {
		return err
	}
	user, err := s.userRepo.FindByUsername(principal.Username)
	if err != nil {
		slog.Error("Current user lookup failed", "username", principal.Username, "error", err)
		return util.InternalError(err, "查询当前用户失败")
	}
	if user == nil {
		return util.Unauthorized("当前用户不存在")
	}

	query := r.URL.Query()
	timeRange, err := util.ParseTimeRange(query)
	if err != nil {
		return err
	}
	filter := repository.StrikeFilter{
		UserID:        user.ID,
		CreatedAfter:  timeRange.After,
		CreatedBefore: timeRange.Before,
	}
	pagination, err := util.ParsePagination(query, defaultPageSize, maxPageSize)
	if err != nil {
		return err
	}
	return s.respondStrikes(w, filter, pagination.Limit, pagination.Offset)
}

func (s *meService) respondStrikes(w http.ResponseWriter, filter repository.StrikeFilter, limit, offset int64) error {
	total, err := s.strikeRepo.Count(filter)
	if err != nil {
		return util.InternalError(err, "查询违规记录失败")
	}
	records, err := s.strikeRepo.List(filter, limit, offset)
	if err != nil {
		return util.InternalError(err, "查询违规记录失败")
	}
	response := PageResponse[MeStrikeResponse]{
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
	return util.RespondJson(w, response)
}
