import type { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z as zod } from "zod/v4";

import { post } from "./post";

/**
 * Post schemas
 */
export const selectPostSchema = createSelectSchema(post);
export const insertPostSchema = createInsertSchema(post, {
  title: () => zod.string().max(256),
  content: () => zod.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Types
 */
export type Post = z.infer<typeof selectPostSchema>;
export type NewPost = z.infer<typeof insertPostSchema>;
