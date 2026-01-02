# syntax=docker/dockerfile:1.11
# API Rotate Server - Hono + Bun

# Stage 1: Install dependencies with Node/pnpm
FROM node:22-slim AS deps
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/server/package.json ./apps/server/
COPY tooling/ ./tooling/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Stage 2: Build with Bun
FROM oven/bun:1.1.38 AS build
WORKDIR /app
ENV NODE_ENV="production"

# Copy entire deps output (includes all workspace node_modules with proper symlinks)
COPY --from=deps /app ./
# Copy source code on top
COPY apps/server/src ./apps/server/src
COPY apps/server/tsconfig.json ./apps/server/tsconfig.json
COPY packages/ ./packages/

# Build the server binary
RUN cd apps/server && \
    bun build --compile --sourcemap src/index.ts --outfile=server

# Stage 3: Runtime
FROM debian:bullseye-slim AS runtime

# Install curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

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
ENV PORT=3001
#EXPOSE 3001

# Health check for Swarm to verify container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/v1/health || exit 1

ENTRYPOINT ["/bin/server"]
