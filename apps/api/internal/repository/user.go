package repository

import (
	"auth/.gen/main/public/model"
	. "auth/.gen/main/public/table"
	"database/sql"
	"time"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/go-jet/jet/v2/qrm"
)

const (
	RoleAdmin      string = "admin"
	RoleTrusted    string = "trusted"
	RoleMember     string = "member"
	RoleRestricted string = "restricted"
	RoleBanned     string = "banned"
)

type User = model.AuthUser

type UserFilter struct {
	Query         string
	Role          string
	CreatedBefore time.Time
	CreatedAfter  time.Time
}

type UserRepository interface {
	List(filter UserFilter, size int64, skip int64) ([]User, error)
	Count(filter UserFilter) (int64, error)
	FindByUsername(username string) (*User, error)
	FindByEmail(email string) (*User, error)
	Save(user *User) error
	UpdateLastLogin(user *User) error
	UpdateHashedPassword(user *User) error
	UpdateRole(user *User) error
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (filter UserFilter) exp() BoolExpression {
	exps := []BoolExpression{}
	if filter.Query != "" {
		exps = append(exps, OR(
			AuthUser.Username.LIKE(String(filter.Query)),
			AuthUser.Email.LIKE(String(filter.Query)),
		))
	}
	if filter.Role != "" {
		exps = append(exps, AuthUser.Role.EQ(String(filter.Role)))
	}
	if !filter.CreatedBefore.IsZero() {
		exps = append(exps, AuthUser.CreatedAt.LT(TimestampzT(filter.CreatedBefore)))
	}
	if !filter.CreatedAfter.IsZero() {
		exps = append(exps, AuthUser.CreatedAt.GT(TimestampzT(filter.CreatedAfter)))
	}
	if len(exps) == 0 {
		return RawBool("TRUE")
	}
	return AND(exps...)
}

func (r *userRepository) List(filter UserFilter, size int64, skip int64) ([]User, error) {
	stmt := SELECT(AuthUser.AllColumns).
		FROM(AuthUser).
		WHERE(filter.exp()).
		ORDER_BY(AuthUser.ID.ASC()).
		OFFSET(skip).
		LIMIT(size)

	var dest []User
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return dest, nil
}

func (r *userRepository) Count(filter UserFilter) (int64, error) {
	stmt := SELECT(COUNT(STAR)).
		FROM(AuthUser).
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

func (r *userRepository) FindByUsername(username string) (*User, error) {
	stmt := SELECT(AuthUser.AllColumns).
		FROM(AuthUser).
		WHERE(AuthUser.Username.EQ(String(username)))

	var dest User
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &dest, nil
}

func (r *userRepository) FindByEmail(email string) (*User, error) {
	stmt := SELECT(AuthUser.AllColumns).
		FROM(AuthUser).
		WHERE(AuthUser.Email.EQ(String(email)))

	var dest User
	err := stmt.Query(r.db, &dest)
	if err == qrm.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &dest, nil
}

func (r *userRepository) Save(user *User) error {
	stmt := AuthUser.INSERT(AuthUser.MutableColumns).
		MODEL(user)

	_, err := stmt.Exec(r.db)
	return err
}

func (r *userRepository) UpdateLastLogin(user *User) error {
	stmt := AuthUser.UPDATE(AuthUser.LastLogin).
		SET(TimestampzT(time.Now())).
		WHERE(AuthUser.ID.EQ(Int(user.ID)))

	_, err := stmt.Exec(r.db)
	return err
}

func (r *userRepository) UpdateHashedPassword(user *User) error {
	stmt := AuthUser.UPDATE(AuthUser.Password).
		SET(String(user.Password)).
		WHERE(AuthUser.ID.EQ(Int(user.ID)))

	_, err := stmt.Exec(r.db)
	return err
}

func (r *userRepository) UpdateRole(user *User) error {
	stmt := AuthUser.UPDATE(AuthUser.Role).
		SET(String(user.Role)).
		WHERE(AuthUser.ID.EQ(Int(user.ID)))

	_, err := stmt.Exec(r.db)
	return err
}
