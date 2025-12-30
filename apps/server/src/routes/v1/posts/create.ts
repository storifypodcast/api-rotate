import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, post } from "@api_rotate/db";
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
