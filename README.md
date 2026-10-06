# Auth 认证服务

[![GPL-3.0](https://img.shields.io/github/license/auto-novel/auth)](https://github.com/auto-novel/auth#license)
[![cd-web](https://github.com/auto-novel/auth/actions/workflows/cd-web.yml/badge.svg)](https://github.com/auto-novel/auth/actions/workflows/cd-web.yml)
[![cd-api](https://github.com/auto-novel/auth/actions/workflows/cd-api.yml/badge.svg)](https://github.com/auto-novel/auth/actions/workflows/cd-api.yml)

提供统一登录认证（SSO）服务，支持用户注册、登录、令牌管理和邮箱验证等功能。

## 贡献

请务必在编写代码前阅读[贡献指南](https://github.com/auto-novel/auth/blob/main/CONTRIBUTING.md)，感谢所有为本项目做出贡献的人们！

## 部署

> [!WARNING]
> 注意：本项目并不是为了个人部署设计的，不保证所有功能可用和前向兼容。

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
TURNSTILE_SECRET=<turnstile_secret>
TURNSTILE_HOSTNAMES=n.novelia.cc
EOF

# 3. 启动服务
docker compose up -d
```

启动后，访问 http://localhost:4000 即可。

## 第三方服务

以下环境变量配置在 `.env` 中。

### Mailgun

用于发送验证码邮件，使用 EU 区域接口。

| 参数             | 说明     |
| ---------------- | -------- |
| `MAILGUN_DOMAIN` | 发信域名 |
| `MAILGUN_APIKEY` | API 密钥 |

### Cloudflare Turnstile

用于注册和找回密码时的人机验证。

| 参数                  | 说明                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| `TURNSTILE_SECRET`    | 服务端密钥                                                                   |
| `TURNSTILE_HOSTNAMES` | 允许的前端域名，逗号分隔，如 `n.novelia.cc,forum.novelia.cc`；仅支持精确匹配 |
| `SITE_KEY`            | 前端站点密钥，在 `apps/login/src/components/Turnstile.vue` 中修改            |
