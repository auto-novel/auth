package util

import "github.com/lib/pq"

func IsUniqueConstraintViolation(err error, constraint string) bool {
	if pqErr, ok := err.(*pq.Error); ok {
		return pqErr.Code == "23505" && pqErr.Constraint == constraint
	}
	return false
}
