package repository

import (
	"auth/.gen/main/public/model"
	. "auth/.gen/main/public/table"
	"database/sql"
	"encoding/json"
	"time"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/go-jet/jet/v2/qrm"
)

type Event = model.AuthEvent

type DailyAuthStat struct {
	Date          time.Time
	LoginCount    int64
	RegisterCount int64
}

type EventFilter struct {
	ActorUser     string
	TargetUser    string
	Action        string
	CreatedAfter  time.Time
	CreatedBefore time.Time
}

type EventRepository interface {
	List(filter EventFilter, size int64, skip int64) ([]*Event, error)
	Count(filter EventFilter) (int64, error)
	DailyAuthStats(startDate, endDate time.Time, timezone string) ([]DailyAuthStat, error)
	Save(action string, detail interface{}) error
}

type eventRepository struct {
	db *sql.DB
}

func NewEventRepository(db *sql.DB) EventRepository {
	return &eventRepository{
		db: db,
	}
}

func (filter EventFilter) exp() BoolExpression {
	exps := []BoolExpression{}
	if filter.ActorUser != "" {
		exps = append(exps, RawBool("detail ->> 'actor_user' = $user",
			map[string]interface{}{"$user": filter.ActorUser}))
	}
	if filter.TargetUser != "" {
		exps = append(exps, RawBool("detail ->> 'target_user' = $user",
			map[string]interface{}{"$user": filter.TargetUser}))
	}
	if filter.Action != "" {
		exps = append(exps, AuthEvent.Action.EQ(String(filter.Action)))
	}
	if !filter.CreatedAfter.IsZero() {
		exps = append(exps, AuthEvent.CreatedAt.GT(TimestampzT(filter.CreatedAfter)))
	}
	if !filter.CreatedBefore.IsZero() {
		exps = append(exps, AuthEvent.CreatedAt.LT(TimestampzT(filter.CreatedBefore)))
	}
	if len(exps) == 0 {
		return RawBool("TRUE")
	}
	return AND(exps...)
}

func (r *eventRepository) List(filter EventFilter, size int64, skip int64) ([]*Event, error) {
	stmt := SELECT(AuthEvent.AllColumns).
		FROM(AuthEvent).
		WHERE(filter.exp()).
		ORDER_BY(AuthEvent.ID.DESC()).
		OFFSET(skip).
		LIMIT(size)

	var dest []*Event
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return dest, nil
}

func (r *eventRepository) Count(filter EventFilter) (int64, error) {
	stmt := SELECT(COUNT(STAR)).
		FROM(AuthEvent).
		WHERE(filter.exp())

	var dest struct {
		Count int64
	}
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return 0, nil
	} else if err != nil {
		return 0, err
	}
	return dest.Count, nil
}

func (r *eventRepository) DailyAuthStats(
	startDate time.Time,
	endDate time.Time,
	timezone string,
) ([]DailyAuthStat, error) {
	if endDate.Before(startDate) {
		return []DailyAuthStat{}, nil
	}

	endExclusive := endDate.AddDate(0, 0, 1)

	date := RawDate(
		"(auth_event.created_at AT TIME ZONE #timezone)::date",
		RawArgs{"#timezone": timezone},
	)
	loginCount := SUM(
		CASE().
			WHEN(AuthEvent.Action.EQ(String("login"))).
			THEN(Int32(1)).
			ELSE(Int32(0)),
	).AS("DailyAuthStat.LoginCount")
	registerCount := SUM(
		CASE().
			WHEN(AuthEvent.Action.EQ(String("register"))).
			THEN(Int32(1)).
			ELSE(Int32(0)),
	).AS("DailyAuthStat.RegisterCount")

	stmt := SELECT(
		date.AS("DailyAuthStat.Date"),
		loginCount,
		registerCount,
	).
		FROM(AuthEvent).
		WHERE(
			AuthEvent.Action.IN(String("login"), String("register")).
				AND(AuthEvent.CreatedAt.GT_EQ(TimestampzT(startDate))).
				AND(AuthEvent.CreatedAt.LT(TimestampzT(endExclusive))),
		).
		GROUP_BY(RawInt("1")).
		ORDER_BY(RawInt("1").ASC())

	var rows []DailyAuthStat
	err := stmt.Query(r.db, &rows)
	if err == qrm.ErrNoRows {
		rows = nil
	} else if err != nil {
		return nil, err
	}

	statsByDate := make(map[string]DailyAuthStat, len(rows))
	for _, row := range rows {
		statsByDate[row.Date.Format(time.DateOnly)] = row
	}

	stats := make([]DailyAuthStat, 0)
	for day := startDate; !day.After(endDate); day = day.AddDate(0, 0, 1) {
		stat := statsByDate[day.Format(time.DateOnly)]
		stat.Date = day
		stats = append(stats, stat)
	}

	return stats, nil
}

func (r *eventRepository) Save(action string, detail interface{}) error {
	detailEncoded, _ := json.Marshal(detail)
	event := &Event{
		Action:    action,
		Detail:    string(detailEncoded),
		CreatedAt: time.Now(),
	}
	stmt := AuthEvent.INSERT(AuthEvent.MutableColumns).
		MODEL(event)

	_, err := stmt.Exec(r.db)
	return err
}
