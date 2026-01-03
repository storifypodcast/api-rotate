# syntax=docker/dockerfile:1.11
# API Rotate Web - Next.js (Optimized)

# ============================================
# Base stage - common setup
# ============================================
FROM node:22-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable corepack (pnpm version read from package.json packageManager field)
RUN corepack enable

# ============================================
# Dependencies stage - install all deps
# ============================================
FROM base AS deps

# Copy package.json first to read pnpm version from packageManager field
COPY package.json ./
RUN corepack install

# Copy lockfiles and workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tooling/ ./tooling/

# Install dependencies with cache mount (--ignore-scripts skips postinstall sherif check)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# ============================================
# Build stage - build the application
# ============================================
FROM base AS build
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package.json and install correct pnpm version
COPY package.json ./
RUN corepack install

# Copy everything from deps (including node_modules)
COPY --from=deps /app ./

# Build packages first, then web with standalone output
RUN pnpm -F @api_rotate/db build && \
    pnpm -F @api_rotate/crypto build && \
    cd apps/web && pnpm next build

# ============================================
# Runtime stage - minimal production image
# ============================================
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install curl for health checks and create non-root user
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (includes only needed node_modules)
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Copy static assets
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

ENV HOSTNAME="0.0.0.0"

# Health check for Swarm
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Run standalone server directly (reads env vars at runtime)
CMD ["node", "apps/web/server.js"]
