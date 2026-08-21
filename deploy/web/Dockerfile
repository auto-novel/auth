FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/login/package.json ./apps/login/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM deps AS builder
WORKDIR /app
ARG VITE_COMMIT_SHA
ARG VITE_BUILD_TIME
COPY apps/login/. ./apps/login/
COPY apps/admin/. ./apps/admin/
RUN VITE_COMMIT_SHA="${VITE_COMMIT_SHA}" \
    VITE_BUILD_TIME="${VITE_BUILD_TIME}" \
    pnpm run build

FROM caddy:2.7.4
COPY --from=builder /app/apps/login/dist /dist
COPY --from=builder /app/apps/admin/dist /admin
COPY deploy/web/Caddyfile /etc/caddy/Caddyfile
