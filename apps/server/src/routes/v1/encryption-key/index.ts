import { Hono } from "hono";

import { authMiddleware } from "~/libs/middlewares";

import { getInfo } from "./info";
import { setup } from "./setup";

export const encryptionKeyRouter = new Hono();

// Admin routes (for web UI - requires Better Auth session)
encryptionKeyRouter.get("/info", authMiddleware, getInfo);
encryptionKeyRouter.post("/setup", authMiddleware, setup);
