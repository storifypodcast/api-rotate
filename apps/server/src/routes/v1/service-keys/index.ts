import { Hono } from "hono";

import { authMiddleware } from "~/libs/middlewares";

import { createServiceKey } from "./create";
import { listServiceKeys } from "./list";
import { revokeServiceKey } from "./revoke";

export const serviceKeysRouter = new Hono();

// All service key management routes require session auth
serviceKeysRouter.post("/", authMiddleware, createServiceKey);
serviceKeysRouter.get("/", authMiddleware, listServiceKeys);
serviceKeysRouter.delete("/:id", authMiddleware, revokeServiceKey);
