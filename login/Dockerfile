FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY login/package.json ./login/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY login/. ./login/
RUN pnpm run build

FROM caddy:2.7.4
COPY --from=builder /app/login/dist /dist
COPY login/Caddyfile /etc/caddy/Caddyfile
