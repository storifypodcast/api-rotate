import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { HTTPException } from "hono/http-exception";

import { env } from "./env";
import { auth } from "./libs/auth";
import { loggingMiddleware } from "./libs/middlewares";
import { createLogger } from "./libs/utils/logger";
import { v1Router } from "./routes/v1";

const log = createLogger("Server");

const app = new Hono();

// Global error handler - format all errors consistently
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    const status = err.status;
    return c.json(
      {
        success: false,
        error: {
          message: err.message,
          code: `HTTP_${status}`,
        },
      },
      status,
    );
  }

  log.error({ error: err }, "Unhandled error");
  return c.json(
    {
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    },
    500,
  );
});

/**
 * Allowed origins for CORS
 * Configure via CORS_ORIGINS env variable (comma-separated)
 */
const ALLOWED_ORIGINS = env.CORS_ORIGINS;

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // Check exact matches from environment
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Development mode: allow localhost
  if (env.NODE_ENV === "development") {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    if (localhostPattern.test(origin)) return true;
  }

  return false;
}

// Global middlewares
app.use(
  "*",
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : ""),
    credentials: true,
  }),
);
app.use("*", loggingMiddleware);

// Better Auth handler
app.on(["POST", "GET"], "/v1/auth/**", (c) => auth.handler(c.req.raw));

// API routes
app.route("/v1", v1Router);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "API Rotate Server",
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
