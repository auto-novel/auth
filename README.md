# Auth 认证服务

[![GPL-3.0](https://img.shields.io/github/license/auto-novel/auth)](https://github.com/auto-novel/auth#license)
[![cd-web](https://github.com/auto-novel/auth/actions/workflows/cd-web.yml/badge.svg)](https://github.com/auto-novel/auth/actions/workflows/cd-web.yml)
[![cd-api](https://github.com/auto-novel/auth/actions/workflows/cd-api.yml/badge.svg)](https://github.com/auto-novel/auth/actions/workflows/cd-api.yml)

提供统一登录认证（SSO）服务，支持用户注册、登录、令牌管理和邮箱验证等功能。

## 部署

```bash
# 1. 克隆仓库
git clone https://github.com/auto-novel/auth.git
cd auth

# 2. 生成环境变量配置
cat > .env << EOF
REFRESH_TOKEN_SECRET=$(openssl rand -base64 48)
ACCESS_TOKEN_SECRET=$(openssl rand -base64 48)
POSTGRES_PASSWORD=$(openssl rand -base64 48)
MAILGUN_DOMAIN=verify.fishhawk.top
MAILGUN_APIKEY=<mailgun_apikey>
EOF

# 3. 启动服务
docker compose up -d
```

## 开发

使用本地编译镜像启动服务：

```bash
export COMPOSE_FILE="docker-compose.yml:docker-compose.debug.yml"
docker compose up -d
```

### Web

设置开发环境：

```bash
cd web

# 安装依赖
pnpm install
```

启动开发服务器：

```bash
# 确保服务正在运行
docker compose up -d

cd web

# 启动开发服务器
pnpm run dev
```

### Api

设置开发环境：

```bash
cd api

# 安装依赖
go mod download

# 生成 Jet SQL 代码
./script/build_jet.sh

# 编译
go build
```

运行集成测试：

```bash
# 确保服务正在运行
docker compose up -d

cd api

# 运行测试（需要服务已启动）
go clean -testcache
go test ./... -v -p 4
```
