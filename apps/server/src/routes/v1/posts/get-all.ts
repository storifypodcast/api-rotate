import type { Context } from "hono";

import { db, desc, post } from "@api_rotate/db";
import { successResponse } from "~/libs/utils/response";

export async function getAllPosts(c: Context) {
  const posts = await db.query.post.findMany({
    orderBy: desc(post.id),
    limit: 10,
  });

  return successResponse(c, posts);
}
