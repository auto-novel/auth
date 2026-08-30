package util

import (
	"errors"

	"github.com/lib/pq"
)

func IsUniqueConstraintViolation(err error, constraint string) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return pqErr.Code == "23505" && pqErr.Constraint == constraint
	}
	return false
}
