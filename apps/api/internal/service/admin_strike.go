package service

import (
	"auth/internal/repository"
	"auth/internal/util"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

const (
	strikePeriod    = 100 * 24 * time.Hour
	maxStrikePoints = 3
)

type AdminStrikeService interface {
	Use(chi.Router)
}

type adminStrikeService struct {
	userRepo   repository.UserRepository
	eventRepo  repository.EventRepository
	strikeRepo repository.StrikeRepository
}

func NewAdminStrikeService(
	userRepo repository.UserRepository,
	eventRepo repository.EventRepository,
	strikeRepo repository.StrikeRepository,
) AdminStrikeService {
	return &adminStrikeService{
		userRepo:   userRepo,
		eventRepo:  eventRepo,
		strikeRepo: strikeRepo,
	}
}

type StrikeResponse struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"userId"`
	OperatorID *int64     `json:"operatorId,omitempty"`
	Reason     string     `json:"reason"`
	Evidence   string     `json:"evidence"`
	Point      int16      `json:"point"`
	CreatedAt  time.Time  `json:"createdAt"`
	RevokedAt  *time.Time `json:"revokedAt,omitempty"`
	RevokedBy  *int64     `json:"revokedBy,omitempty"`
	Attr       string     `json:"attr"`
}

func (s *adminStrikeService) Use(router chi.Router) {
	router.Get("/", util.EH(s.GetStrikes))
	router.Post("/", util.EH(s.CreateStrike))
	router.Post("/{strikeID}/revoke", util.EH(s.RevokeStrike))
}

func strikeResponse(record repository.StrikeRecord) StrikeResponse {
	return StrikeResponse{
		ID: record.ID, UserID: record.UserID, OperatorID: record.OperatorID,
		Reason: record.Reason, Evidence: record.Evidence, Point: record.Point,
		CreatedAt: record.CreatedAt, RevokedAt: record.RevokedAt,
		RevokedBy: record.RevokedBy, Attr: record.Attr,
	}
}

func strikePage(records []repository.StrikeRecord, total int64) PageResponse[StrikeResponse] {
	response := PageResponse[StrikeResponse]{Total: total, Items: make([]StrikeResponse, len(records))}
	for i, record := range records {
		response.Items[i] = strikeResponse(record)
	}
	return response
}

func pageParams(query url.Values) (int64, int64) {
	page := util.GetQueryAsInt(query, "page", 1)
	pageSize := util.GetQueryAsInt(query, "page_size", 50)
	return page, pageSize
}

func (s *adminStrikeService) findStrikeTarget(username string) (*repository.User, error) {
	if username == "" {
		return nil, util.BadRequest("无效的用户名")
	}
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		slog.Error("Target user lookup failed", "username", username, "error", err)
		return nil, util.InternalServerError("查询用户失败")
	}
	if user == nil {
		return nil, util.NotFound("用户不存在")
	}
	return user, nil
}

func (s *adminStrikeService) createStrike(
	adminUsername string,
	target *repository.User,
	reason string,
	evidence string,
	point int16,
) (repository.StrikeRecord, error) {
	if target.Role != repository.RoleMember {
		return repository.StrikeRecord{}, util.Unauthorized("没有权限对非普通用户进行操作")
	}
	operator, err := s.userRepo.FindByUsername(adminUsername)
	if err != nil {
		return repository.StrikeRecord{}, util.InternalServerError("查询操作用户失败")
	}
	if operator == nil {
		return repository.StrikeRecord{}, util.Unauthorized("操作用户不存在")
	}
	if point <= 0 {
		point = 1
	}
	record := repository.StrikeRecord{
		UserID: target.ID, OperatorID: &operator.ID, Reason: reason, Evidence: evidence,
		Point: point, CreatedAt: time.Now(), Attr: "{}",
	}
	restricted, err := s.strikeRepo.SaveAndRestrictUser(
		&record,
		time.Now().Add(-strikePeriod),
		maxStrikePoints,
	)
	if err != nil {
		slog.Error("Failed to save strike record", "username", target.Username, "error", err)
		return repository.StrikeRecord{}, util.InternalServerError("保存违规记录失败")
	}
	if restricted {
		if err := s.eventRepo.Save(EventRestrictUser, &struct {
			ActorUser  string `json:"actor_user"`
			TargetUser string `json:"target_user"`
			Reason     string `json:"reason"`
		}{adminUsername, target.Username, "三振出局"}); err != nil {
			slog.Warn("Failed to save automatic restriction event", "username", target.Username, "error", err)
		}
	}
	return record, nil
}

func (s *adminStrikeService) GetStrikes(w http.ResponseWriter, r *http.Request) error {
	if _, err := util.VerifyAccessToken(r, true); err != nil {
		return err
	}
	query := r.URL.Query()
	filter := repository.StrikeFilter{
		CreatedAfter:  util.GetQueryAsTime(query, "created_after", time.Time{}),
		CreatedBefore: util.GetQueryAsTime(query, "created_before", time.Time{}),
	}
	if username := query.Get("username"); username != "" {
		target, err := s.findStrikeTarget(username)
		if err != nil {
			return err
		}
		filter.UserID = target.ID
	}
	if value := query.Get("operator_id"); value != "" {
		operatorID, parseErr := strconv.ParseInt(value, 10, 64)
		if parseErr != nil || operatorID <= 0 {
			return util.BadRequest("operator_id 必须为正整数")
		}
		filter.OperatorID = &operatorID
	}
	page, pageSize := pageParams(query)
	total, err := s.strikeRepo.Count(filter)
	if err != nil {
		return util.InternalServerError("查询违规记录失败")
	}
	records, err := s.strikeRepo.List(filter, pageSize, (page-1)*pageSize)
	if err != nil {
		return util.InternalServerError("查询违规记录失败")
	}
	return util.RespondJson(w, strikePage(records, total))
}

func (s *adminStrikeService) CreateStrike(w http.ResponseWriter, r *http.Request) error {
	adminUsername, err := util.VerifyAccessToken(r, true)
	if err != nil {
		return err
	}
	req, err := util.Body[struct {
		Username string `json:"username" validate:"required"`
		Reason   string `json:"reason" validate:"required"`
		Evidence string `json:"evidence" validate:"required"`
		Point    int16  `json:"point" validate:"omitempty,min=1"`
	}](r)
	if err != nil {
		return err
	}
	target, err := s.findStrikeTarget(req.Username)
	if err != nil {
		return err
	}
	record, err := s.createStrike(adminUsername, target, req.Reason, req.Evidence, req.Point)
	if err != nil {
		return err
	}
	return util.RespondJson(w, strikeResponse(record))
}

func (s *adminStrikeService) RevokeStrike(w http.ResponseWriter, r *http.Request) error {
	adminUsername, err := util.VerifyAccessToken(r, true)
	if err != nil {
		return err
	}
	strikeID, err := strconv.ParseInt(chi.URLParam(r, "strikeID"), 10, 64)
	if err != nil || strikeID <= 0 {
		return util.BadRequest("无效的违规记录 ID")
	}
	record, err := s.strikeRepo.FindByID(strikeID)
	if err != nil {
		return util.InternalServerError("查询违规记录失败")
	}
	if record == nil {
		return util.NotFound("违规记录不存在")
	}
	operator, err := s.userRepo.FindByUsername(adminUsername)
	if err != nil {
		return util.InternalServerError("查询操作用户失败")
	}
	if operator == nil {
		return util.Unauthorized("操作用户不存在")
	}
	revoked, err := s.strikeRepo.Revoke(record.ID, operator.ID, time.Now())
	if err != nil {
		return util.InternalServerError("撤销违规记录失败")
	}
	if revoked == nil {
		return util.Conflict("违规记录已撤销")
	}
	return util.RespondJson(w, strikeResponse(*revoked))
}
