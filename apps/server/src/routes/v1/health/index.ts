import { Hono } from "hono";

import { healthCheck } from "./get";

export const healthRouter = new Hono();

healthRouter.get("/", healthCheck);
