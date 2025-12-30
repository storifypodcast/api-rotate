# syntax=docker/dockerfile:1.11
# Storify Server - Hono + Bun

# Stage 1: Build
FROM oven/bun:1.1.38 AS build
WORKDIR /app
ENV NODE_ENV="production"

# Copy everything and build
COPY . .
RUN bun install --production --frozen-lockfile --ignore-scripts && \
    cd apps/server && \
    bun build --compile --sourcemap src/index.ts --outfile=server

# Stage 2: Runtime
FROM debian:bullseye-slim AS runtime

# Copy compiled server binary
COPY \
    --from=build \
    --chown=1000:1000 \
    --chmod=555 \
    --link \
    "/app/apps/server/server" "/bin/"

# Copy database migrations
COPY \
    --from=build \
    --chown=1000:1000 \
    --link \
    "/app/packages/db/drizzle" "/migrations"

USER 1000:1000
WORKDIR /
EXPOSE 3001
ENTRYPOINT ["/bin/server"]
