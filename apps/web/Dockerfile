# syntax=docker/dockerfile:1.11
# API Rotate Web - Next.js

FROM node:22-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Stage 1: Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tooling/ ./tooling/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Stage 2: Build
FROM base AS build
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true

# # Build-time environment variables (placeholder values for build)
# ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
# ENV AUTH_SECRET="placeholder-secret-for-build-time-only-min32"
# ENV BETTER_AUTH_SECRET="placeholder-secret-for-build-time-only-min32"
# ENV BETTER_AUTH_URL="http://localhost:3000"

# Copy everything from deps (including node_modules)
COPY --from=deps /app ./

# Build the packages first, then web (run next build directly, not with-env)
RUN pnpm -F @api_rotate/db build && \
    pnpm -F @api_rotate/crypto build && \
    cd apps/web && pnpm next build

# Fix permissions for node user
RUN chown -R node:node /app

# Stage 3: Runtime
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy built application with correct ownership
COPY --from=build --chown=node:node /app ./

USER node
#EXPOSE 3000
#ENV PORT=3000
#ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "@api_rotate/web", "start"]
