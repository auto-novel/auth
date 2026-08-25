package repository

import (
	"auth/.gen/main/public/model"
	. "auth/.gen/main/public/table"
	"database/sql"
	"fmt"
	"time"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/go-jet/jet/v2/qrm"
)

type StrikeRecord = model.AuthStrikeRecord

type StrikeDetails struct {
	model.AuthStrikeRecord
	Username          *string
	OperatorUsername  *string
	RevokedByUsername *string
}

type StrikeFilter struct {
	UserID        int64
	OperatorID    *int64
	Revoked       *bool
	CreatedAfter  time.Time
	CreatedBefore time.Time
}

type StrikeRepository interface {
	List(filter StrikeFilter, size int64, skip int64) ([]StrikeRecord, error)
	ListDetails(filter StrikeFilter, size int64, skip int64) ([]StrikeDetails, error)
	Count(filter StrikeFilter) (int64, error)
	FindDetailsByID(id int64) (*StrikeDetails, error)
	SaveAndRestrictUser(record *StrikeRecord, createdAfter time.Time, maxPoints int64) (bool, error)
	Revoke(id int64, revokedBy int64, revokedAt time.Time) (*StrikeRecord, error)
}

func selectStrikeDetails() SelectStatement {
	targetUser := AuthUser.AS("target_user")
	operatorUser := AuthUser.AS("operator_user")
	revokerUser := AuthUser.AS("revoker_user")
	return SELECT(
		AuthStrikeRecord.AllColumns,
		targetUser.Username.AS("StrikeDetails.Username"),
		operatorUser.Username.AS("StrikeDetails.OperatorUsername"),
		revokerUser.Username.AS("StrikeDetails.RevokedByUsername"),
	).FROM(
		AuthStrikeRecord.LEFT_JOIN(
			targetUser,
			AuthStrikeRecord.UserID.EQ(targetUser.ID),
		).
			LEFT_JOIN(
				operatorUser,
				AuthStrikeRecord.OperatorID.EQ(operatorUser.ID),
			).
			LEFT_JOIN(
				revokerUser,
				AuthStrikeRecord.RevokedBy.EQ(revokerUser.ID),
			),
	)
}

func (r *strikeRepository) ListDetails(
	filter StrikeFilter,
	size int64,
	skip int64,
) ([]StrikeDetails, error) {
	stmt := selectStrikeDetails().
		WHERE(filter.exp()).
		ORDER_BY(AuthStrikeRecord.CreatedAt.DESC(), AuthStrikeRecord.ID.DESC()).
		OFFSET(skip).
		LIMIT(size)

	var dest []StrikeDetails
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	}
	return dest, err
}

type strikeRepository struct {
	db *sql.DB
}

func NewStrikeRepository(db *sql.DB) StrikeRepository {
	return &strikeRepository{db: db}
}

func (filter StrikeFilter) exp() BoolExpression {
	exps := []BoolExpression{}
	if filter.UserID != 0 {
		exps = append(exps, AuthStrikeRecord.UserID.EQ(Int(filter.UserID)))
	}
	if filter.OperatorID != nil {
		exps = append(exps, AuthStrikeRecord.OperatorID.EQ(Int(*filter.OperatorID)))
	}
	if filter.Revoked != nil {
		if *filter.Revoked {
			exps = append(exps, AuthStrikeRecord.RevokedAt.IS_NOT_NULL())
		} else {
			exps = append(exps, AuthStrikeRecord.RevokedAt.IS_NULL())
		}
	}
	if !filter.CreatedAfter.IsZero() {
		exps = append(exps, AuthStrikeRecord.CreatedAt.GT(TimestampzT(filter.CreatedAfter)))
	}
	if !filter.CreatedBefore.IsZero() {
		exps = append(exps, AuthStrikeRecord.CreatedAt.LT(TimestampzT(filter.CreatedBefore)))
	}
	if len(exps) == 0 {
		return RawBool("TRUE")
	}
	return AND(exps...)
}

func (r *strikeRepository) List(filter StrikeFilter, size int64, skip int64) ([]StrikeRecord, error) {
	stmt := SELECT(AuthStrikeRecord.AllColumns).
		FROM(AuthStrikeRecord).
		WHERE(filter.exp()).
		ORDER_BY(AuthStrikeRecord.CreatedAt.DESC(), AuthStrikeRecord.ID.DESC()).
		OFFSET(skip).
		LIMIT(size)

	var dest []StrikeRecord
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	}
	return dest, err
}

func (r *strikeRepository) Count(filter StrikeFilter) (int64, error) {
	stmt := SELECT(COUNT(STAR)).FROM(AuthStrikeRecord).WHERE(filter.exp())
	var dest struct{ Count int64 }
	err := stmt.Query(r.db, &dest)
	return dest.Count, err
}

func sumStrikePoints(db qrm.DB, filter StrikeFilter) (int64, error) {
	stmt := SELECT(COALESCE(SUM(AuthStrikeRecord.Point), Int(0)).AS("Total")).
		FROM(AuthStrikeRecord).
		WHERE(filter.exp())
	var dest struct{ Total int64 }
	err := stmt.Query(db, &dest)
	return dest.Total, err
}

func (r *strikeRepository) FindDetailsByID(id int64) (*StrikeDetails, error) {
	stmt := selectStrikeDetails().
		WHERE(AuthStrikeRecord.ID.EQ(Int(id)))

	var dest StrikeDetails
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &dest, nil
}

func saveStrike(db qrm.DB, record *StrikeRecord) error {
	stmt := AuthStrikeRecord.INSERT(AuthStrikeRecord.MutableColumns).
		MODEL(record).
		RETURNING(AuthStrikeRecord.AllColumns)
	return stmt.Query(db, record)
}

func (r *strikeRepository) SaveAndRestrictUser(
	record *StrikeRecord,
	createdAfter time.Time,
	maxPoints int64,
) (bool, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	lockUserStmt := SELECT(AuthUser.ID).
		FROM(AuthUser).
		WHERE(AuthUser.ID.EQ(Int(record.UserID))).
		FOR(UPDATE())
	var lockedUser struct{ ID int64 }
	if err := lockUserStmt.Query(tx, &lockedUser); err != nil {
		return false, fmt.Errorf("lock strike user %d: %w", record.UserID, err)
	}

	if err := saveStrike(tx, record); err != nil {
		return false, err
	}

	revoked := false
	points, err := sumStrikePoints(tx, StrikeFilter{
		UserID: record.UserID, Revoked: &revoked, CreatedAfter: createdAfter,
	})
	if err != nil {
		return false, err
	}

	restricted := points >= maxPoints
	if restricted {
		stmt := AuthUser.UPDATE(AuthUser.Role).
			SET(String(RoleRestricted)).
			WHERE(
				AuthUser.ID.EQ(Int(record.UserID)).
					AND(AuthUser.Role.EQ(String(RoleMember))),
			)
		result, err := stmt.Exec(tx)
		if err != nil {
			return false, err
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return false, err
		}
		if rowsAffected != 1 {
			return false, fmt.Errorf("restrict strike user %d: affected %d rows", record.UserID, rowsAffected)
		}
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return restricted, nil
}

func (r *strikeRepository) Revoke(
	id int64,
	revokedBy int64,
	revokedAt time.Time,
) (*StrikeRecord, error) {
	stmt := AuthStrikeRecord.UPDATE(
		AuthStrikeRecord.RevokedAt,
		AuthStrikeRecord.RevokedBy,
	).
		SET(
			TimestampzT(revokedAt),
			Int(revokedBy),
		).
		WHERE(
			AuthStrikeRecord.ID.EQ(Int(id)).
				AND(AuthStrikeRecord.RevokedAt.IS_NULL()),
		).
		RETURNING(AuthStrikeRecord.AllColumns)

	var record StrikeRecord
	err := stmt.Query(r.db, &record)
	if err == qrm.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &record, nil
}
