package repository

import (
	"context"
	"database/sql"
	"errors"
)

var ErrInvalidStrikeRead = errors.New("invalid strike read boundary")

type MyStrikePage struct {
	Total          int64
	Items          []StrikeRecord
	LatestStrikeID int64
}

// ListMyStrikes reads the page and its acknowledgement boundary from one snapshot.
// The boundary covers all of this user's strikes, regardless of filters or pagination.
func (r *strikeRepository) ListMyStrikes(ctx context.Context, filter StrikeFilter, size, skip int64) (MyStrikePage, error) {
	var page MyStrikePage
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelRepeatableRead, ReadOnly: true})
	if err != nil {
		return page, err
	}
	defer tx.Rollback()

	err = tx.QueryRowContext(ctx, `
		SELECT COALESCE(MAX(id), 0) FROM auth_strike_record WHERE user_id = $1
	`, filter.UserID).Scan(&page.LatestStrikeID)
	if err != nil {
		return page, err
	}
	page.Total, err = countStrikes(ctx, tx, filter)
	if err != nil {
		return page, err
	}
	page.Items, err = listStrikes(ctx, tx, filter, size, skip)
	if err != nil {
		return page, err
	}
	return page, tx.Commit()
}

const unreadStrikesQuery = `
	SELECT EXISTS (
		SELECT 1 FROM auth_strike_record s
		WHERE s.user_id = u.id AND s.id > u.last_seen_strike_id
	)
	FROM auth_user u WHERE u.id = $1
`

func (r *strikeRepository) HasUnreadStrikes(ctx context.Context, userID int64) (bool, error) {
	var unread bool
	err := r.db.QueryRowContext(ctx, unreadStrikesQuery, userID).Scan(&unread)
	return unread, err
}

// MarkStrikesRead never moves the cursor backwards or acknowledges a strike that
// was added after the caller's snapshot. Zero is a valid boundary for an empty list.
func (r *strikeRepository) MarkStrikesRead(ctx context.Context, userID, throughID int64) (bool, error) {
	if throughID < 0 {
		return false, ErrInvalidStrikeRead
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx, `
		UPDATE auth_user
		SET last_seen_strike_id = GREATEST(last_seen_strike_id, $2)
		WHERE id = $1 AND ($2 = 0 OR EXISTS (
			SELECT 1 FROM auth_strike_record WHERE user_id = $1 AND id = $2
		))
	`, userID, throughID)
	if err != nil {
		return false, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	if rows != 1 {
		return false, ErrInvalidStrikeRead
	}

	// The user row remains locked, also serializing with SaveAndRestrictUser.
	var unread bool
	if err := tx.QueryRowContext(ctx, unreadStrikesQuery, userID).Scan(&unread); err != nil {
		return false, err
	}
	return unread, tx.Commit()
}
