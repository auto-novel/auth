package infra

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func NewSqlDb(host string, port int, user, password, dbname string) *sql.DB {
	db, err := sql.Open(
		"postgres",
		fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
			host, port, user, password, dbname,
		),
	)
	if err != nil {
		panic(err)
	}
	return db
}
