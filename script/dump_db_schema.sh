#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/.." && pwd)"

exec docker compose \
  --file "$project_root/docker-compose.yml" \
  exec -T postgresql \
  pg_dump \
  --username=auth \
  --dbname=auth \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges
