#!/usr/bin/env bash
cd "$(dirname "$0")/../"

echo "启动 PostgreSQL 容器"
CONTAINER_ID=$(docker run -d \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=pass \
  -e POSTGRES_DB=main \
  -p 12345:5432 \
  -v $(pwd)/../sql/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:17-alpine)

echo "等待 PostgreSQL 准备就绪"
while ! docker exec $CONTAINER_ID pg_isready -U user -d main; do
  sleep 1
done
sleep 1

echo "生成 Jet 代码"
$(go env GOPATH)/bin/jet -dsn="postgresql://user:pass@localhost:12345/main?sslmode=disable" -schema=public -path=./.gen

echo "清理 PostgreSQL 容器"
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID

echo "代码生成完成"
