import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, eq, post } from "@api_rotate/db";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { getPostSchema } from "./schema";

export async function getPostById(c: Context) {
  const parseResult = getPostSchema.safeParse({ id: c.req.param("id") });

  if (!parseResult.success) {
    throw new HTTPException(400, {
      message: "Invalid post ID",
    });
  }

  const { id } = parseResult.data;

  const foundPost = await db.query.post.findFirst({
    where: eq(post.id, id),
  });

  if (!foundPost) {
    return errorResponse(c, "Post not found", 404, "POST_NOT_FOUND");
  }

  return successResponse(c, foundPost);
}
