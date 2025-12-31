import { Hono } from "hono";

import { authMiddleware, serviceAuthMiddleware } from "~/libs/middlewares";

import { createKey } from "./create";
import { deleteKey } from "./delete";
import { getNextKey } from "./get-next";
import { getRandomKey } from "./get-random";
import { listKeys } from "./list";
import { reportError } from "./report-error";
import { getStats } from "./stats";
import { updateKey } from "./update";

export const keysRouter = new Hono();

// Service API routes (for client SDK - requires SERVICE_API_KEY)
keysRouter.get("/next", serviceAuthMiddleware, getNextKey);
keysRouter.get("/random", serviceAuthMiddleware, getRandomKey);
keysRouter.post("/report-error", serviceAuthMiddleware, reportError);

// Admin routes (for web UI - requires Better Auth session)
keysRouter.get("/", authMiddleware, listKeys);
keysRouter.get("/stats", authMiddleware, getStats);
keysRouter.post("/", authMiddleware, createKey);
keysRouter.patch("/:id", authMiddleware, updateKey);
keysRouter.delete("/:id", authMiddleware, deleteKey);
