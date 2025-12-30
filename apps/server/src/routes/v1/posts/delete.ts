import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, eq, post } from "@api_rotate/db";
import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

import { deletePostSchema } from "./schema";

export async function deletePost(c: Context<{ Variables: AuthVariables }>) {
  const parseResult = deletePostSchema.safeParse({ id: c.req.param("id") });

  if (!parseResult.success) {
    throw new HTTPException(400, {
      message: "Invalid post ID",
    });
  }

  const { id } = parseResult.data;

  await db.delete(post).where(eq(post.id, id));

  return successResponse(c, { success: true });
}
