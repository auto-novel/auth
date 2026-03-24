FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY web/package.json web/pnpm-lock.yaml .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY web/. .
RUN pnpm run build

FROM caddy:2.7.4
COPY --from=builder /app/dist /dist
COPY web/Caddyfile /etc/caddy/Caddyfile
