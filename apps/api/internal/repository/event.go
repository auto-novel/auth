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

type EventFilter struct {
	ActorUser     string
	TargetUser    string
	Action        string
	CreatedAfter  time.Time
	CreatedBefore time.Time
}

type EventRepository interface {
	List(filter EventFilter, pageNumber, pageSize int64) ([]*Event, error)
	Count(filter EventFilter) (int64, error)
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
	return AND(exps...)
}

func (r *eventRepository) List(filter EventFilter, pageNumber, pageSize int64) ([]*Event, error) {
	stmt := SELECT(AuthEvent.AllColumns).
		FROM(AuthEvent).
		WHERE(filter.exp()).
		ORDER_BY(AuthEvent.ID.ASC()).
		LIMIT(pageSize).
		OFFSET(pageNumber * pageSize)

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
	stmt := SELECT(COUNT(AuthEvent.ID)).
		FROM(AuthEvent).
		WHERE(filter.exp())

	var count int64
	err := stmt.Query(r.db, &count)
	if err == qrm.ErrNoRows {
		return 0, nil
	} else if err != nil {
		return 0, err
	}
	return count, nil
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
