import { Hono } from "hono";

import { healthRouter } from "./health";
import { keysRouter } from "./keys";

export const v1Router = new Hono();

v1Router.route("/health", healthRouter);
v1Router.route("/keys", keysRouter);
