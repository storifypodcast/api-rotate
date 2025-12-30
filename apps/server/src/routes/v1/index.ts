import { Hono } from "hono";

import { healthRouter } from "./health";
import { postsRouter } from "./posts";

export const v1Router = new Hono();

v1Router.route("/health", healthRouter);
v1Router.route("/posts", postsRouter);
