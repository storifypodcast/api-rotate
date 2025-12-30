# From T3-Turbo to Full-Stack Monorepo

A step-by-step guide to transform [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo) into a production-ready full-stack monorepo with:

- **Next.js 16** frontend (web)
- **Hono + Bun** backend server (REST API)
- **Expo** mobile app (preserved)
- **tRPC** for internal type-safe API
- **Better Auth** with Email OTP
- **Drizzle ORM** with PostgreSQL
- **Docker** deployment support

---

## Table of Contents

### Part 1: Setup & Configuration
1. [Prerequisites](#1-prerequisites)
2. [Clone T3-Turbo](#2-clone-t3-turbo)
3. [Rename Project Namespace](#3-rename-project-namespace)
4. [Remove TanStack Start](#4-remove-tanstack-start)
5. [Restructure Apps](#5-restructure-apps)
6. [Update Database Configuration](#6-update-database-configuration)
7. [Update Authentication](#7-update-authentication)
8. [Create Hono Server](#8-create-hono-server)
9. [Add Docker Support](#9-add-docker-support)
10. [Update Tooling](#10-update-tooling)
11. [Expand UI Components](#11-expand-ui-components)
12. [Final Configuration](#12-final-configuration)
13. [Verification](#13-verification)

### Part 2: Development, Build, Run & Test
14. [Development Workflow](#14-development-workflow)
15. [Building for Production](#15-building-for-production)
16. [Running in Production](#16-running-in-production)
17. [Testing](#17-testing)
18. [Docker Deployment](#18-docker-deployment)

---

## 1. Prerequisites

Ensure you have installed:

```bash
# Node.js 22+
node --version  # v22.x.x

# pnpm 10+
pnpm --version  # 10.x.x

# Bun 1.1+
bun --version   # 1.1.x

# Docker (optional, for deployment)
docker --version
```

---

## 2. Clone T3-Turbo

```bash
# Clone the template
git clone https://github.com/t3-oss/create-t3-turbo.git my-app
cd my-app

# Remove git history and start fresh
rm -rf .git
git init

# Install dependencies
pnpm install

# Copy environment example
cp .env.example .env
```

### Initial Structure

```
my-app/
├── apps/
│   ├── nextjs/           # Will rename to "web"
│   ├── expo/             # Keep as-is
│   └── tanstack-start/   # Will remove
├── packages/
│   ├── api/              # tRPC routers
│   ├── auth/             # Better Auth
│   ├── db/               # Drizzle ORM
│   ├── ui/               # UI components
│   └── validators/       # Will remove (optional)
└── tooling/
    ├── eslint/
    ├── prettier/
    ├── tailwind/
    └── typescript/
```

---

## 3. Rename Project Namespace

Replace `@acme` with your project name (e.g., `@myapp`).

### 3.1 Automated Find & Replace

```bash
# macOS/Linux - Replace @acme with @myapp
find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.yaml" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -exec sed -i '' 's/@acme/@myapp/g' {} +

# Linux (GNU sed)
find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.yaml" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -exec sed -i 's/@acme/@myapp/g' {} +
```

### 3.2 Manual Verification

Check these files were updated:

- [ ] All `package.json` files
- [ ] All TypeScript imports
- [ ] `pnpm-workspace.yaml`
- [ ] `turbo.json`

### 3.3 Update Package Names

Each `package.json` should have the new name:

```json
// packages/api/package.json
{ "name": "@myapp/api" }

// packages/auth/package.json
{ "name": "@myapp/auth" }

// packages/db/package.json
{ "name": "@myapp/db" }

// packages/ui/package.json
{ "name": "@myapp/ui" }

// tooling/*/package.json
{ "name": "@myapp/eslint-config" }
{ "name": "@myapp/prettier-config" }
{ "name": "@myapp/tailwind-config" }
{ "name": "@myapp/tsconfig" }
```

---

## 4. Remove TanStack Start

### 4.1 Delete the App

```bash
rm -rf apps/tanstack-start
```

### 4.2 Update Root package.json

Remove TanStack Start scripts from `package.json`:

```json
{
  "scripts": {
    "build": "turbo run build",
    "clean": "git clean -xdf node_modules",
    "clean:workspaces": "turbo run clean",
    "db:push": "turbo -F @myapp/db push",
    "db:studio": "turbo -F @myapp/db studio",
    "dev": "turbo watch dev",
    "dev:web": "turbo watch dev -F @myapp/web...",
    "format": "turbo run format --continue -- --cache --cache-location .cache/.prettiercache",
    "format:fix": "turbo run format --continue -- --write --cache --cache-location .cache/.prettiercache",
    "lint": "turbo run lint --continue",
    "lint:fix": "turbo run lint --continue -- --fix",
    "lint:ws": "pnpm dlx sherif@latest",
    "typecheck": "turbo run typecheck",
    "ui-add": "turbo run ui-add",
    "auth:generate": "turbo -F @myapp/auth generate"
  }
}
```

### 4.3 Remove validators Package (Optional)

If not using the validators package:

```bash
rm -rf packages/validators
```

Update any imports that reference it or keep it for future use.

---

## 5. Restructure Apps

### 5.1 Rename nextjs to web

```bash
mv apps/nextjs apps/web
```

### 5.2 Update apps/web/package.json

```json
{
  "name": "@myapp/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm with-env next build",
    "clean": "git clean -xdf .cache .next .turbo node_modules",
    "dev": "pnpm with-env next dev --turbopack",
    "format": "prettier --check . --ignore-path ../../.gitignore",
    "lint": "eslint",
    "start": "pnpm with-env next start",
    "typecheck": "tsc --noEmit",
    "with-env": "dotenv -e ../../.env --"
  },
  "dependencies": {
    "@myapp/api": "workspace:*",
    "@myapp/auth": "workspace:*",
    "@myapp/db": "workspace:*",
    "@myapp/ui": "workspace:*",
    "@t3-oss/env-nextjs": "^0.13.8",
    "@tanstack/react-query": "catalog:",
    "@trpc/client": "catalog:",
    "@trpc/server": "catalog:",
    "@trpc/tanstack-react-query": "catalog:",
    "better-auth": "catalog:",
    "geist": "^1.4.2",
    "next": "^16.0.9",
    "react": "catalog:react19",
    "react-dom": "catalog:react19",
    "superjson": "2.2.3",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@myapp/eslint-config": "workspace:*",
    "@myapp/prettier-config": "workspace:*",
    "@myapp/tailwind-config": "workspace:*",
    "@myapp/tsconfig": "workspace:*",
    "@tailwindcss/postcss": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:react19",
    "@types/react-dom": "catalog:react19",
    "dotenv-cli": "catalog:",
    "eslint": "catalog:",
    "jiti": "catalog:",
    "prettier": "catalog:",
    "tailwindcss": "catalog:",
    "typescript": "catalog:"
  },
  "prettier": "@myapp/prettier-config"
}
```

### 5.3 Update apps/expo/package.json

```json
{
  "name": "@myapp/expo",
  "version": "0.1.0",
  "private": true,
  "main": "src/app/_layout.tsx",
  "scripts": {
    "android": "expo run:android",
    "clean": "git clean -xdf .cache .expo .turbo node_modules",
    "dev": "expo start --ios",
    "dev:android": "expo start --android",
    "format": "prettier --check . --ignore-path ../../.gitignore",
    "ios": "expo run:ios",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@myapp/api": "workspace:*",
    "@myapp/auth": "workspace:*",
    "@myapp/ui": "workspace:*",
    "@better-auth/expo": "catalog:",
    "@t3-oss/env-core": "^0.13.8",
    "@tanstack/react-query": "catalog:",
    "@trpc/client": "catalog:",
    "@trpc/server": "catalog:",
    "@trpc/tanstack-react-query": "catalog:",
    "expo": "~54.0.20",
    "expo-linking": "~7.1.6",
    "expo-router": "~5.0.7",
    "expo-secure-store": "~15.0.2",
    "expo-status-bar": "~2.2.3",
    "nativewind": "^4.1.23",
    "react": "catalog:react19",
    "react-native": "0.79.2",
    "react-native-safe-area-context": "5.4.0",
    "react-native-screens": "~4.11.1",
    "superjson": "2.2.3",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@babel/core": "^7.27.4",
    "@babel/preset-env": "^7.27.2",
    "@babel/runtime": "^7.27.6",
    "@myapp/eslint-config": "workspace:*",
    "@myapp/prettier-config": "workspace:*",
    "@myapp/tailwind-config": "workspace:*",
    "@myapp/tsconfig": "workspace:*",
    "@types/react": "catalog:react19",
    "eslint": "catalog:",
    "prettier": "catalog:",
    "tailwindcss": "catalog:",
    "typescript": "catalog:"
  },
  "prettier": "@myapp/prettier-config"
}
```

---

## 6. Update Database Configuration

### 6.1 Replace Vercel Postgres with node-postgres

Update `packages/db/package.json`:

```json
{
  "name": "@myapp/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./src/index.ts"
    },
    "./client": {
      "types": "./dist/client.d.ts",
      "default": "./src/client.ts"
    },
    "./schema": {
      "types": "./dist/schema/index.d.ts",
      "default": "./src/schema/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "clean": "git clean -xdf .turbo dist node_modules",
    "dev": "tsc --watch",
    "format": "prettier --check . --ignore-path ../../.gitignore",
    "lint": "eslint",
    "push": "pnpm with-env drizzle-kit push",
    "studio": "pnpm with-env drizzle-kit studio",
    "typecheck": "tsc --noEmit",
    "with-env": "dotenv -e ../../.env --"
  },
  "dependencies": {
    "drizzle-orm": "catalog:",
    "drizzle-zod": "catalog:",
    "postgres": "^3.4.7",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@myapp/eslint-config": "workspace:*",
    "@myapp/prettier-config": "workspace:*",
    "@myapp/tsconfig": "workspace:*",
    "@types/node": "catalog:",
    "dotenv-cli": "catalog:",
    "drizzle-kit": "catalog:",
    "eslint": "catalog:",
    "prettier": "catalog:",
    "typescript": "catalog:"
  },
  "prettier": "@myapp/prettier-config"
}
```

### 6.2 Update Database Client

Replace `packages/db/src/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Singleton pattern for development hot-reload
const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Connection pool configuration
const poolConfig = {
  max: process.env.NODE_ENV === "production" ? 20 : 30,
  idle_timeout: 20,
  connect_timeout: 10,
};

export const client =
  globalForDb.client ?? postgres(connectionString, poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});
```

### 6.3 Update Drizzle Config

Replace `packages/db/drizzle.config.ts`:

```typescript
import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default {
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: "snake_case",
} satisfies Config;
```

### 6.4 Update Schema Exports

Update `packages/db/src/index.ts`:

```typescript
export * from "drizzle-orm/sql";
export { alias } from "drizzle-orm/pg-core";
export * from "./schema";
```

### 6.5 Update Auth Schema

Replace `packages/db/src/schema/auth.ts` (generated by Better Auth CLI):

```typescript
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);
export const insertSessionSchema = createInsertSchema(session);
export const selectSessionSchema = createSelectSchema(session);
```

### 6.6 Update Post Schema

Replace `packages/db/src/schema/post.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const post = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Zod schemas with custom validation
export const insertPostSchema = createInsertSchema(post, {
  title: z.string().min(1, "Title is required").max(256, "Title too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(256, "Content too long"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectPostSchema = createSelectSchema(post);

// Type exports
export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type CreatePostInput = z.infer<typeof insertPostSchema>;
```

### 6.7 Update Schema Index

Replace `packages/db/src/schema/index.ts`:

```typescript
// Auth tables
export {
  user,
  userRelations,
  session,
  sessionRelations,
  account,
  accountRelations,
  verification,
  insertUserSchema,
  selectUserSchema,
  insertSessionSchema,
  selectSessionSchema,
} from "./auth";

// Post table
export {
  post,
  insertPostSchema,
  selectPostSchema,
  type Post,
  type NewPost,
  type CreatePostInput,
} from "./post";
```

---

## 7. Update Authentication

### 7.1 Update Auth Package

Replace `packages/auth/src/index.ts`:

```typescript
import type { Auth } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";
import { expo } from "@better-auth/expo";
import { nextCookies } from "better-auth/next-js";

import { db } from "@myapp/db/client";

import { env } from "./env";

type InitAuthOptions = {
  baseUrl?: string;
};

export type { Auth };

export const initAuth = (options?: InitAuthOptions) => {
  const baseUrl = options?.baseUrl ?? "http://localhost:3000";
  const isProduction = env.NODE_ENV === "production";
  const productionUrl = env.BETTER_AUTH_URL;

  return betterAuth({
    baseURL: isProduction && productionUrl ? productionUrl : baseUrl,
    secret: env.AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 300, // 5 minutes
        sendVerificationOTP: async ({ email, otp, type }) => {
          // TODO: Implement email sending
          // For development, log to console
          console.log(`[Auth] OTP for ${email}: ${otp} (type: ${type})`);

          // Production example with Resend:
          // await resend.emails.send({
          //   from: 'noreply@yourapp.com',
          //   to: email,
          //   subject: 'Your verification code',
          //   html: `Your code is: ${otp}`,
          // });
        },
      }),
      expo(),
      nextCookies(),
    ],
    emailAndPassword: {
      enabled: false, // Using OTP instead
    },
    trustedOrigins: ["expo://"],
  });
};

// Re-export for type inference
export { emailOTPClient } from "better-auth/client/plugins";
```

### 7.2 Update Auth Environment

Replace `packages/auth/src/env.ts`:

```typescript
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  skipValidation: process.env.CI === "true" || process.env.SKIP_ENV_VALIDATION === "true",
});

// Export for consumers
export const authEnv = () =>
  createEnv({
    server: {
      AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.string().url().optional(),
    },
    runtimeEnv: process.env,
    skipValidation: process.env.CI === "true" || process.env.SKIP_ENV_VALIDATION === "true",
  });
```

### 7.3 Update Auth Package.json

```json
{
  "name": "@myapp/auth",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./src/index.ts"
    },
    "./env": {
      "types": "./dist/env.d.ts",
      "default": "./src/env.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "clean": "git clean -xdf .turbo dist node_modules",
    "dev": "tsc --watch",
    "format": "prettier --check . --ignore-path ../../.gitignore",
    "generate": "pnpm with-env npx @better-auth/cli generate --output ../db/src/schema/auth.ts",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "with-env": "dotenv -e ../../.env --"
  },
  "dependencies": {
    "@better-auth/expo": "catalog:",
    "@myapp/db": "workspace:*",
    "@t3-oss/env-core": "^0.13.8",
    "better-auth": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@myapp/eslint-config": "workspace:*",
    "@myapp/prettier-config": "workspace:*",
    "@myapp/tsconfig": "workspace:*",
    "dotenv-cli": "catalog:",
    "eslint": "catalog:",
    "prettier": "catalog:",
    "typescript": "catalog:"
  },
  "prettier": "@myapp/prettier-config"
}
```

### 7.4 Update Web App Auth

Replace `apps/web/src/auth/server.ts`:

```typescript
import { cache } from "react";
import { headers } from "next/headers";

import { initAuth } from "@myapp/auth";

import { env } from "~/env";

// Initialize auth with environment-based URL
const getBaseUrl = () => {
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export const auth = initAuth({
  baseUrl: getBaseUrl(),
});

// Cache session per request
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
```

Replace `apps/web/src/auth/client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

import { emailOTPClient } from "@myapp/auth";

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
```

---

## 8. Create Hono Server

### 8.1 Create Server Directory Structure

```bash
mkdir -p apps/server/src/{libs/{middlewares,utils},routes/v1/{health,posts}}
```

### 8.2 Create apps/server/package.json

```json
{
  "name": "@myapp/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "bun build src/index.ts --compile --sourcemap --outfile dist/server",
    "clean": "git clean -xdf .turbo dist node_modules",
    "dev": "bun --watch src/index.ts",
    "format": "prettier --check . --ignore-path ../../.gitignore",
    "lint": "eslint",
    "start": "./dist/server",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@myapp/auth": "workspace:*",
    "@myapp/db": "workspace:*",
    "@t3-oss/env-core": "^0.13.8",
    "better-auth": "catalog:",
    "hono": "^4.7.11",
    "pino": "^9.6.0",
    "pino-pretty": "^13.0.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@myapp/eslint-config": "workspace:*",
    "@myapp/prettier-config": "workspace:*",
    "@myapp/tsconfig": "workspace:*",
    "@types/bun": "^1.1.16",
    "eslint": "catalog:",
    "prettier": "catalog:",
    "typescript": "catalog:"
  },
  "prettier": "@myapp/prettier-config"
}
```

### 8.3 Create apps/server/src/env.ts

```typescript
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
```

### 8.4 Create apps/server/src/libs/auth.ts

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@myapp/db/client";

import { env } from "../env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3001",
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: ["http://localhost:3000", "expo://"],
});
```

### 8.5 Create apps/server/src/libs/utils/logger.ts

```typescript
import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const baseLogger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export const createLogger = (name: string) => baseLogger.child({ name });
```

### 8.6 Create apps/server/src/libs/utils/response.ts

```typescript
import type { Context } from "hono";

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export function successResponse<T>(
  c: Context,
  data: T,
  status: 200 | 201 = 200
) {
  return c.json<SuccessResponse<T>>({ success: true, data }, status);
}

export function errorResponse(
  c: Context,
  message: string,
  status: 400 | 401 | 403 | 404 | 500 = 400,
  code?: string,
  details?: unknown
) {
  return c.json<ErrorResponse>(
    {
      success: false,
      error: { message, code, details },
    },
    status
  );
}
```

### 8.7 Create apps/server/src/libs/middlewares/logging.ts

```typescript
import type { Context, Next } from "hono";

import { createLogger } from "../utils/logger";

const log = createLogger("HTTP");

export async function loggingMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const { method, path } = c.req;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  log.info({ method, path, status, duration: `${duration}ms` }, "Request");
}
```

### 8.8 Create apps/server/src/libs/middlewares/auth.ts

```typescript
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "../auth";

export interface AuthVariables {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    userId: string;
  };
}

export async function authMiddleware(
  c: Context<{ Variables: AuthVariables }>,
  next: Next
) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
}
```

### 8.9 Create apps/server/src/libs/middlewares/index.ts

```typescript
export { loggingMiddleware } from "./logging";
export { authMiddleware, type AuthVariables } from "./auth";
```

### 8.10 Create apps/server/src/routes/v1/health/get.ts

```typescript
import type { Context } from "hono";

import { successResponse } from "~/libs/utils/response";

export async function getHealth(c: Context) {
  return successResponse(c, {
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

### 8.11 Create apps/server/src/routes/v1/health/index.ts

```typescript
import { Hono } from "hono";

import { getHealth } from "./get";

export const healthRouter = new Hono();

healthRouter.get("/", getHealth);
```

### 8.12 Create apps/server/src/routes/v1/posts/schema.ts

```typescript
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().min(1).max(256),
});

export const postIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

### 8.13 Create apps/server/src/routes/v1/posts/get-all.ts

```typescript
import type { Context } from "hono";

import { db, desc, post } from "@myapp/db";

import { successResponse } from "~/libs/utils/response";

export async function getAllPosts(c: Context) {
  const posts = await db.query.post.findMany({
    orderBy: desc(post.id),
    limit: 10,
  });

  return successResponse(c, posts);
}
```

### 8.14 Create apps/server/src/routes/v1/posts/get-by-id.ts

```typescript
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, eq, post } from "@myapp/db";

import { successResponse } from "~/libs/utils/response";

export async function getPostById(c: Context) {
  const id = c.req.param("id");

  const result = await db.query.post.findFirst({
    where: eq(post.id, id),
  });

  if (!result) {
    throw new HTTPException(404, { message: "Post not found" });
  }

  return successResponse(c, result);
}
```

### 8.15 Create apps/server/src/routes/v1/posts/create.ts

```typescript
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, post } from "@myapp/db";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

import { createPostSchema } from "./schema";

export async function createPost(c: Context<{ Variables: AuthVariables }>) {
  const parseResult = createPostSchema.safeParse(await c.req.json());

  if (!parseResult.success) {
    throw new HTTPException(400, {
      message: "Invalid request body",
    });
  }

  const data = parseResult.data;

  const [newPost] = await db.insert(post).values(data).returning();

  return successResponse(c, newPost, 201);
}
```

### 8.16 Create apps/server/src/routes/v1/posts/delete.ts

```typescript
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, eq, post } from "@myapp/db";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

export async function deletePost(c: Context<{ Variables: AuthVariables }>) {
  const id = c.req.param("id");

  const existing = await db.query.post.findFirst({
    where: eq(post.id, id),
  });

  if (!existing) {
    throw new HTTPException(404, { message: "Post not found" });
  }

  await db.delete(post).where(eq(post.id, id));

  return successResponse(c, { deleted: true });
}
```

### 8.17 Create apps/server/src/routes/v1/posts/index.ts

```typescript
import { Hono } from "hono";

import { authMiddleware, type AuthVariables } from "~/libs/middlewares";

import { createPost } from "./create";
import { deletePost } from "./delete";
import { getAllPosts } from "./get-all";
import { getPostById } from "./get-by-id";

export const postsRouter = new Hono<{ Variables: AuthVariables }>();

// Public routes
postsRouter.get("/", getAllPosts);
postsRouter.get("/:id", getPostById);

// Protected routes
postsRouter.post("/", authMiddleware, createPost);
postsRouter.delete("/:id", authMiddleware, deletePost);
```

### 8.18 Create apps/server/src/routes/v1/index.ts

```typescript
import { Hono } from "hono";

import { healthRouter } from "./health";
import { postsRouter } from "./posts";

export const v1Router = new Hono();

v1Router.route("/health", healthRouter);
v1Router.route("/posts", postsRouter);
```

### 8.19 Create apps/server/src/index.ts

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";

import { env } from "./env";
import { auth } from "./libs/auth";
import { loggingMiddleware } from "./libs/middlewares";
import { createLogger } from "./libs/utils/logger";
import { v1Router } from "./routes/v1";

const log = createLogger("Server");

const app = new Hono();

// Global middlewares
app.use("*", cors());
app.use("*", loggingMiddleware);

// Better Auth handler
app.on(["POST", "GET"], "/v1/auth/**", (c) => auth.handler(c.req.raw));

// API routes
app.route("/v1", v1Router);

// Root health check
app.get("/", (c) => {
  return c.json({
    name: "My App Server",
    version: "1.0.0",
    status: "ok",
  });
});

// Start server
const port = env.PORT;
const isDev = env.NODE_ENV === "development";

if (isDev) {
  showRoutes(app, { verbose: true, colorize: true });
}

log.info({ port, env: env.NODE_ENV }, "Starting server...");

export default {
  port,
  fetch: app.fetch,
};
```

### 8.20 Create apps/server/tsconfig.json

```json
{
  "extends": "@myapp/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    },
    "types": ["bun"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 9. Add Docker Support

### 9.1 Create docker/docker-compose.yml

```bash
mkdir -p docker
```

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:16
    container_name: myapp-db
    restart: unless-stopped
    ports:
      - "5454:5432"
    environment:
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: myapp
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myapp -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 9.2 Create apps/server/Dockerfile

```dockerfile
# Build stage
FROM oven/bun:1.1.38-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY apps/server/package.json apps/server/

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY packages/db packages/db/
COPY packages/auth packages/auth/
COPY apps/server apps/server/

# Build the server binary
WORKDIR /app/apps/server
RUN bun build src/index.ts --compile --sourcemap --outfile dist/server

# Production stage
FROM debian:bullseye-slim AS runner

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled binary
COPY --from=builder /app/apps/server/dist/server /bin/server

# Copy migrations if needed
COPY --from=builder /app/packages/db/drizzle /migrations

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

ENTRYPOINT ["/bin/server"]
```

### 9.3 Create .dockerignore

```
node_modules
.git
.turbo
.next
.expo
dist
*.log
.env*.local
```

---

## 10. Update Tooling

### 10.1 Update pnpm-workspace.yaml

Add new catalog entries if needed:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"

catalog:
  # Existing entries...

  # Add Bun types
  "@types/bun": "^1.1.16"

  # Add Pino
  "pino": "^9.6.0"
  "pino-pretty": "^13.0.0"

  # Add Hono
  "hono": "^4.7.11"
```

### 10.2 Update turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": ["**/.env"],
  "globalEnv": [
    "DATABASE_URL",
    "AUTH_SECRET",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "PORT"
  ],
  "globalPassThroughEnv": [
    "NODE_ENV",
    "CI",
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
    "npm_lifecycle_event",
    "SKIP_ENV_VALIDATION"
  ],
  "tasks": {
    "topo": {
      "dependsOn": ["^topo"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        ".expo/**",
        "dist/**"
      ]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "format": {
      "outputs": [".cache/.prettiercache"],
      "outputLogs": "new-only"
    },
    "lint": {
      "dependsOn": ["^topo", "^build"]
    },
    "typecheck": {
      "dependsOn": ["^topo", "^build"],
      "outputs": [".tsbuildinfo"]
    },
    "clean": {
      "cache": false
    },
    "push": {
      "cache": false,
      "interactive": true
    },
    "studio": {
      "cache": false,
      "persistent": true,
      "interactive": true
    },
    "ui-add": {
      "cache": false,
      "interactive": true
    }
  }
}
```

### 10.3 Update Root package.json Scripts

```json
{
  "scripts": {
    "build": "turbo run build",
    "clean": "git clean -xdf node_modules",
    "clean:workspaces": "turbo run clean",
    "db:push": "turbo -F @myapp/db push",
    "db:studio": "turbo -F @myapp/db studio",
    "dev": "turbo watch dev",
    "dev:web": "turbo watch dev -F @myapp/web...",
    "dev:server": "turbo watch dev -F @myapp/server...",
    "dev:expo": "turbo watch dev -F @myapp/expo...",
    "format": "turbo run format --continue -- --cache --cache-location .cache/.prettiercache",
    "format:fix": "turbo run format --continue -- --write --cache --cache-location .cache/.prettiercache",
    "lint": "turbo run lint --continue",
    "lint:fix": "turbo run lint --continue -- --fix",
    "lint:ws": "pnpm dlx sherif@latest",
    "typecheck": "turbo run typecheck",
    "ui-add": "turbo run ui-add",
    "auth:generate": "turbo -F @myapp/auth generate"
  }
}
```

---

## 11. Expand UI Components

### 11.1 Add More Shadcn Components

From the `packages/ui` directory:

```bash
cd packages/ui

# Core components
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add alert
pnpm dlx shadcn@latest add progress
pnpm dlx shadcn@latest add avatar

# Navigation
pnpm dlx shadcn@latest add sidebar
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add breadcrumb

# Forms
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add checkbox
pnpm dlx shadcn@latest add radio-group
pnpm dlx shadcn@latest add switch
pnpm dlx shadcn@latest add slider
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add popover

# Advanced
pnpm dlx shadcn@latest add command
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add collapsible
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add chart
```

### 11.2 Update UI Package Exports

Update `packages/ui/package.json` exports to include new components.

---

## 12. Final Configuration

### 12.1 Update .env.example

```bash
# Database
DATABASE_URL="postgresql://myapp:myapp@localhost:5454/myapp"

# Authentication
AUTH_SECRET="your-secret-key-min-32-chars-here"
BETTER_AUTH_URL="http://localhost:3000"

# Server
PORT=3001

# Node
NODE_ENV="development"
```

### 12.2 Create .nvmrc

```
22.21.0
```

### 12.3 Update .gitignore

Add these entries:

```
# Docker
docker/data/

# Bun
*.lockb

# Server build
apps/server/dist/
```

### 12.4 Update GitHub Actions CI

Replace `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]
  merge_group:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./tooling/github/setup

      - name: Copy env
        run: cp .env.example .env

      - name: Lint
        run: pnpm lint && pnpm lint:ws

  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./tooling/github/setup

      - name: Format
        run: pnpm format

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./tooling/github/setup

      - name: Copy env
        run: cp .env.example .env

      - name: Typecheck
        run: pnpm typecheck
```

---

## 13. Verification

### 13.1 Clean Install

```bash
# Remove all node_modules
pnpm clean

# Fresh install
pnpm install
```

### 13.2 Start Database

```bash
cd docker
docker-compose up -d
cd ..
```

### 13.3 Push Database Schema

```bash
pnpm db:push
```

### 13.4 Generate Auth Schema (if needed)

```bash
pnpm auth:generate
```

### 13.5 Start Development Servers

```bash
# All apps
pnpm dev

# Or individually
pnpm dev:web      # Next.js on port 3000
pnpm dev:server   # Hono on port 3001
pnpm dev:expo     # Expo mobile
```

### 13.6 Verify Endpoints

```bash
# Web app
curl http://localhost:3000

# Server health
curl http://localhost:3001/v1/health

# Server posts
curl http://localhost:3001/v1/posts
```

### 13.7 Run Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm format
```

---

## Final Architecture

```
my-app/
├── apps/
│   ├── web/              # Next.js 16 frontend (port 3000)
│   │   ├── src/
│   │   │   ├── app/      # App router
│   │   │   ├── auth/     # Auth client/server
│   │   │   └── trpc/     # tRPC client
│   │   └── Dockerfile
│   ├── server/           # Hono + Bun backend (port 3001)
│   │   ├── src/
│   │   │   ├── libs/     # Auth, middlewares, utils
│   │   │   └── routes/   # REST API routes
│   │   └── Dockerfile
│   └── expo/             # React Native mobile
│       └── src/
├── packages/
│   ├── api/              # tRPC routers (internal API)
│   ├── auth/             # Better Auth (Email OTP)
│   ├── db/               # Drizzle ORM + PostgreSQL
│   └── ui/               # Shadcn components
├── tooling/
│   ├── eslint/
│   ├── prettier/
│   ├── tailwind/
│   └── typescript/
├── docker/
│   └── docker-compose.yml
└── turbo.json
```

---

## API Architecture

| API | Location | Port | Use Case |
|-----|----------|------|----------|
| **tRPC** | `apps/web/api/trpc` | 3000 | Internal, type-safe, Next.js frontend |
| **REST** | `apps/server/routes/v1` | 3001 | External, mobile apps, third-party |

Both share:
- `@myapp/db` - Same database
- `@myapp/auth` - Same authentication

---

## Next Steps

1. **Implement email sending** for OTP (Resend, SendGrid, etc.)
2. **Add more tRPC procedures** as needed
3. **Add more REST endpoints** for external consumers
4. **Configure production deployment** (Vercel, Cloudflare, Docker)
5. **Add testing** (Vitest, Playwright)
6. **Add monitoring** (Sentry, OpenTelemetry)

---

## Troubleshooting

### Port Conflicts

If ports 3000/3001 are in use:

```bash
# Find process
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check Docker is running
docker ps

# Check PostgreSQL logs
docker logs myapp-db

# Verify connection string
psql "postgresql://myapp:myapp@localhost:5454/myapp"
```

### TypeScript Errors After Rename

```bash
# Clear TypeScript cache
pnpm clean:workspaces
pnpm install
pnpm typecheck
```

---

# Part 2: Development, Build, Run & Test

---

## 14. Development Workflow

### 14.1 Quick Start (Daily Development)

```bash
# 1. Start database (if not running)
cd docker && docker-compose up -d && cd ..

# 2. Start all development servers
pnpm dev
```

This starts:
- **Next.js** (web) at `http://localhost:3000`
- **Hono** (server) at `http://localhost:3001`
- **Expo** (mobile) - follow terminal instructions

### 14.2 Running Individual Apps

```bash
# Web only (Next.js + dependencies)
pnpm dev:web

# Server only (Hono + dependencies)
pnpm dev:server

# Mobile only (Expo + dependencies)
pnpm dev:expo

# Run specific app directly
pnpm -F @myapp/web dev
pnpm -F @myapp/server dev
pnpm -F @myapp/expo dev
```

### 14.3 Database Operations

```bash
# Push schema changes to database
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Generate auth schema from Better Auth CLI
pnpm auth:generate

# Connect to database directly
psql "postgresql://myapp:myapp@localhost:5454/myapp"
```

### 14.4 Code Quality Commands

```bash
# Check linting (all workspaces)
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check formatting
pnpm format

# Fix formatting
pnpm format:fix

# Type checking
pnpm typecheck

# Workspace linting (dependency issues)
pnpm lint:ws
```

### 14.5 Adding UI Components

```bash
# Add a shadcn component to the UI package
pnpm ui-add

# Or directly in the UI package
cd packages/ui
pnpm dlx shadcn@latest add <component-name>
```

### 14.6 Watching Specific Packages

```bash
# Watch database package for changes
pnpm -F @myapp/db dev

# Watch API package for changes
pnpm -F @myapp/api dev

# Watch auth package for changes
pnpm -F @myapp/auth dev
```

### 14.7 Cleaning the Project

```bash
# Remove root node_modules
pnpm clean

# Remove all workspace node_modules and build artifacts
pnpm clean:workspaces

# Full clean and reinstall
pnpm clean && pnpm clean:workspaces && pnpm install
```

---

## 15. Building for Production

### 15.1 Build All Apps

```bash
# Build everything (uses Turborepo caching)
pnpm build
```

This builds:
- `apps/web` → `.next/` directory
- `apps/server` → `dist/server` binary
- `apps/expo` → `.expo/` directory
- All packages → `dist/` directories

### 15.2 Build Individual Apps

```bash
# Build web only
pnpm -F @myapp/web build

# Build server only
pnpm -F @myapp/server build

# Build with dependencies
turbo run build -F @myapp/web...
turbo run build -F @myapp/server...
```

### 15.3 Build Outputs

| App | Build Command | Output | Size |
|-----|---------------|--------|------|
| **Web** | `next build` | `.next/` | ~50-100MB |
| **Server** | `bun build --compile` | `dist/server` (binary) | ~50-80MB |
| **Expo** | `eas build` | `.apk`/`.ipa` | varies |

### 15.4 Environment for Production Build

```bash
# Set production environment
export NODE_ENV=production

# Build with production env file
cp .env.production .env
pnpm build
```

### 15.5 Verify Build

```bash
# Check build outputs exist
ls -la apps/web/.next/
ls -la apps/server/dist/

# Check binary is executable
file apps/server/dist/server
```

---

## 16. Running in Production

### 16.1 Running the Web App (Next.js)

```bash
# Option 1: Using pnpm
cd apps/web
pnpm start

# Option 2: Using next directly
cd apps/web
npx next start -p 3000

# Option 3: With custom port
PORT=8080 pnpm -F @myapp/web start
```

### 16.2 Running the Server (Hono + Bun)

```bash
# Option 1: Run compiled binary
./apps/server/dist/server

# Option 2: Using pnpm
pnpm -F @myapp/server start

# Option 3: Run with Bun directly (without compilation)
cd apps/server
bun src/index.ts

# Option 4: With environment variables
DATABASE_URL="..." AUTH_SECRET="..." PORT=3001 ./apps/server/dist/server
```

### 16.3 Running Both Apps Together

Create a `start-production.sh` script:

```bash
#!/bin/bash

# Load environment variables
set -a
source .env.production
set +a

# Start server in background
./apps/server/dist/server &
SERVER_PID=$!

# Start web app
cd apps/web && pnpm start &
WEB_PID=$!

# Handle shutdown
trap "kill $SERVER_PID $WEB_PID" EXIT

# Wait for both processes
wait
```

### 16.4 Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'myapp-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'myapp-server',
      cwd: './apps/server',
      script: './dist/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
EOF

# Start all apps
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Monitor
pm2 monit

# Stop all
pm2 stop all

# Restart all
pm2 restart all
```

### 16.5 Running Expo in Production

```bash
# Build for iOS
cd apps/expo
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 16.6 Health Checks

```bash
# Check web app
curl -f http://localhost:3000/api/health || echo "Web app down"

# Check server
curl -f http://localhost:3001/v1/health || echo "Server down"

# Check database
pg_isready -h localhost -p 5454 -U myapp || echo "Database down"
```

---

## 17. Testing

### 17.1 Setup Testing Framework

Add Vitest for unit/integration tests:

```bash
# Add to root package.json devDependencies
pnpm add -Dw vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom happy-dom
```

### 17.2 Create Vitest Configuration

Create `vitest.config.ts` in root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', '.next', '.expo', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', '.expo', 'dist', '**/*.d.ts'],
    },
  },
});
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
vi.stubEnv('AUTH_SECRET', 'test-secret-at-least-32-characters-long');
```

### 17.3 Add Test Scripts

Update root `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

### 17.4 Example Unit Tests

**Test for Post Schema** (`packages/db/src/schema/post.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { insertPostSchema } from './post';

describe('Post Schema', () => {
  it('should validate a valid post', () => {
    const result = insertPostSchema.safeParse({
      title: 'Test Post',
      content: 'This is test content',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = insertPostSchema.safeParse({
      title: '',
      content: 'Content',
    });
    expect(result.success).toBe(false);
  });

  it('should reject title over 256 chars', () => {
    const result = insertPostSchema.safeParse({
      title: 'a'.repeat(257),
      content: 'Content',
    });
    expect(result.success).toBe(false);
  });
});
```

**Test for tRPC Router** (`packages/api/src/router/post.test.ts`):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@myapp/db/client', () => ({
  db: {
    query: {
      post: {
        findMany: vi.fn().mockResolvedValue([
          { id: '1', title: 'Test', content: 'Content' },
        ]),
      },
    },
  },
}));

describe('Post Router', () => {
  it('should return posts', async () => {
    // Test implementation
  });
});
```

### 17.5 Integration Tests for Server

Create `apps/server/src/routes/v1/posts/posts.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';

describe('Posts API', () => {
  const app = new Hono();

  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup
  });

  it('GET /v1/posts should return posts', async () => {
    const res = await app.request('/v1/posts');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /v1/posts without auth should return 401', async () => {
    const res = await app.request('/v1/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: 'Content' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(401);
  });
});
```

### 17.6 E2E Tests with Playwright

```bash
# Install Playwright
pnpm add -Dw @playwright/test

# Install browsers
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

Create `e2e/home.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/My App/);
  });

  test('should show posts list', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /posts/i })).toBeVisible();
  });

  test('should navigate to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/auth/);
  });
});
```

Add E2E scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### 17.7 API Testing with Hurl

Create `tests/api/posts.hurl`:

```hurl
# Get all posts
GET http://localhost:3001/v1/posts
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data" isCollection

# Create post without auth (should fail)
POST http://localhost:3001/v1/posts
Content-Type: application/json
{
  "title": "Test Post",
  "content": "Test Content"
}
HTTP 401

# Health check
GET http://localhost:3001/v1/health
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.status" == "ok"
```

Run Hurl tests:

```bash
# Install Hurl
brew install hurl  # macOS
# or
cargo install hurl  # with Rust

# Run tests
hurl --test tests/api/*.hurl
```

### 17.8 Running All Tests

```bash
# Unit tests
pnpm test:run

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# All tests
pnpm test:run && pnpm test:e2e

# Watch mode (development)
pnpm test:watch
```

### 17.9 CI Testing Configuration

Update `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./tooling/github/setup

      - name: Setup test env
        run: |
          cp .env.example .env
          echo "DATABASE_URL=postgresql://test:test@localhost:5432/test" >> .env

      - name: Push database schema
        run: pnpm db:push

      - name: Run unit tests
        run: pnpm test:run

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 18. Docker Deployment

### 18.1 Full Docker Compose Setup

Create `docker/docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: myapp-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-myapp}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-myapp}
      POSTGRES_DB: ${POSTGRES_DB:-myapp}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myapp -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - myapp-network

  server:
    build:
      context: ..
      dockerfile: apps/server/Dockerfile
    container_name: myapp-server
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER:-myapp}:${POSTGRES_PASSWORD:-myapp}@postgres:5432/${POSTGRES_DB:-myapp}
      AUTH_SECRET: ${AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL:-http://localhost:3001}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - myapp-network

  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    container_name: myapp-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-myapp}:${POSTGRES_PASSWORD:-myapp}@postgres:5432/${POSTGRES_DB:-myapp}
      AUTH_SECRET: ${AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - myapp-network

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: myapp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - web
      - server
    networks:
      - myapp-network

volumes:
  postgres_data:

networks:
  myapp-network:
    driver: bridge
```

### 18.2 Create Web App Dockerfile

Create `apps/web/Dockerfile`:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
COPY tooling/eslint/package.json tooling/eslint/
COPY tooling/prettier/package.json tooling/prettier/
COPY tooling/tailwind/package.json tooling/tailwind/
COPY tooling/typescript/package.json tooling/typescript/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages packages/
COPY apps/web apps/web/
COPY tooling tooling/

# Build the application
ENV SKIP_ENV_VALIDATION=true
RUN pnpm -F @myapp/web build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

Update `apps/web/next.config.js` for standalone output:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
};

module.exports = nextConfig;
```

### 18.3 Nginx Configuration

Create `docker/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream web {
        server web:3000;
    }

    upstream api {
        server server:3001;
    }

    server {
        listen 80;
        server_name localhost;

        # Redirect HTTP to HTTPS (uncomment for production)
        # return 301 https://$server_name$request_uri;

        location / {
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /v1/ {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # HTTPS configuration (uncomment for production)
    # server {
    #     listen 443 ssl http2;
    #     server_name localhost;
    #
    #     ssl_certificate /etc/nginx/certs/fullchain.pem;
    #     ssl_certificate_key /etc/nginx/certs/privkey.pem;
    #
    #     # ... same location blocks as above
    # }
}
```

### 18.4 Docker Build Commands

```bash
# Build all images
docker-compose -f docker/docker-compose.prod.yml build

# Build specific image
docker-compose -f docker/docker-compose.prod.yml build server
docker-compose -f docker/docker-compose.prod.yml build web

# Build with no cache
docker-compose -f docker/docker-compose.prod.yml build --no-cache

# Build and tag for registry
docker build -t myapp/server:latest -f apps/server/Dockerfile .
docker build -t myapp/web:latest -f apps/web/Dockerfile .
```

### 18.5 Docker Run Commands

```bash
# Development (database only)
cd docker && docker-compose up -d && cd ..

# Production (all services)
docker-compose -f docker/docker-compose.prod.yml up -d

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker/docker-compose.prod.yml logs -f server
docker-compose -f docker/docker-compose.prod.yml logs -f web

# Stop all services
docker-compose -f docker/docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker/docker-compose.prod.yml down -v

# Restart a service
docker-compose -f docker/docker-compose.prod.yml restart server

# Scale services
docker-compose -f docker/docker-compose.prod.yml up -d --scale server=3
```

### 18.6 Database Migrations in Docker

```bash
# Run migrations inside container
docker-compose -f docker/docker-compose.prod.yml exec server \
  /bin/sh -c "cd /migrations && npx drizzle-kit push"

# Or create a migration script
docker-compose -f docker/docker-compose.prod.yml run --rm \
  -e DATABASE_URL="postgresql://myapp:myapp@postgres:5432/myapp" \
  server sh -c "drizzle-kit push"
```

### 18.7 Docker Health Checks

```bash
# Check container health
docker-compose -f docker/docker-compose.prod.yml ps

# Check specific container
docker inspect --format='{{.State.Health.Status}}' myapp-db
docker inspect --format='{{.State.Health.Status}}' myapp-server

# View health check logs
docker inspect --format='{{json .State.Health}}' myapp-db | jq
```

### 18.8 Production Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Build images
echo "📦 Building Docker images..."
docker-compose -f docker/docker-compose.prod.yml build

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker/docker-compose.prod.yml run --rm server \
  sh -c "drizzle-kit push"

# Start services
echo "🎯 Starting services..."
docker-compose -f docker/docker-compose.prod.yml up -d

# Health check
echo "🏥 Running health checks..."
sleep 5
curl -f http://localhost:3000 || exit 1
curl -f http://localhost:3001/v1/health || exit 1

echo "✅ Deployment complete!"
```

### 18.9 Docker Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# Remove specific project containers/images
docker-compose -f docker/docker-compose.prod.yml down --rmi all
```

---

## Quick Reference

### Essential Commands

| Task | Command |
|------|---------|
| Start dev | `pnpm dev` |
| Start web only | `pnpm dev:web` |
| Start server only | `pnpm dev:server` |
| Build all | `pnpm build` |
| Run tests | `pnpm test:run` |
| Run E2E tests | `pnpm test:e2e` |
| Lint | `pnpm lint` |
| Format | `pnpm format:fix` |
| Type check | `pnpm typecheck` |
| DB push | `pnpm db:push` |
| DB studio | `pnpm db:studio` |

### Production Commands

| Task | Command |
|------|---------|
| Build for prod | `NODE_ENV=production pnpm build` |
| Start web prod | `pnpm -F @myapp/web start` |
| Start server prod | `./apps/server/dist/server` |
| Docker dev | `docker-compose up -d` |
| Docker prod | `docker-compose -f docker/docker-compose.prod.yml up -d` |

### Testing Commands

| Task | Command |
|------|---------|
| Unit tests | `pnpm test:run` |
| Watch mode | `pnpm test:watch` |
| Coverage | `pnpm test:coverage` |
| E2E tests | `pnpm test:e2e` |
| E2E UI | `pnpm test:e2e:ui` |

---

**Guide Version:** 1.0.0
**Based on:** create-t3-turbo + Storify architecture
**Last Updated:** 2024
