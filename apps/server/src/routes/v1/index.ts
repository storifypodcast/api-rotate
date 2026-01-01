import { Hono } from "hono";

import { encryptionKeyRouter } from "./encryption-key";
import { healthRouter } from "./health";
import { keysRouter } from "./keys";
import { serviceKeysRouter } from "./service-keys";

export const v1Router = new Hono();

v1Router.route("/health", healthRouter);
v1Router.route("/keys", keysRouter);
v1Router.route("/service-keys", serviceKeysRouter);
v1Router.route("/encryption-key", encryptionKeyRouter);
