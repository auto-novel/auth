#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/../.." && pwd)"
container_name="auth-test-postgresql-$$"
test_db_port="${TEST_DB_PORT:-4002}"
container_started=false

cleanup() {
  if [[ "$container_started" == true ]]; then
    docker stop "$container_name" >/dev/null
  fi
}
trap cleanup EXIT INT TERM

docker run --rm --detach \
  --name "$container_name" \
  --publish "$test_db_port:5432" \
  --env POSTGRES_USER=auth \
  --env POSTGRES_PASSWORD=auth-test-password \
  --env POSTGRES_DB=auth_test \
  --tmpfs /var/lib/postgresql/data \
  --volume "$project_root/sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  --health-cmd "pg_isready -U auth -d auth_test" \
  --health-interval 1s \
  --health-timeout 5s \
  --health-retries 15 \
  postgres:17-alpine >/dev/null
container_started=true

for _ in {1..30}; do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$container_name")"
  case "$status" in
    healthy)
      break
      ;;
    unhealthy)
      docker logs "$container_name"
      echo "PostgreSQL test container became unhealthy" >&2
      exit 1
      ;;
  esac
  sleep 1
done

if [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container_name")" != healthy ]]; then
  docker logs "$container_name"
  echo "Timed out waiting for PostgreSQL test container" >&2
  exit 1
fi

cd "$project_root/api"
TEST_DB_HOST=127.0.0.1 \
TEST_DB_PORT="$test_db_port" \
TEST_DB_USER=auth \
TEST_DB_PASSWORD=auth-test-password \
TEST_DB_NAME=auth_test \
go test -tags=integration ./tests -count=1 "$@"
