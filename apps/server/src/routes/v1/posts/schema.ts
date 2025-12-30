import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().max(256),
  content: z.string().max(256),
});

export const getPostSchema = z.object({
  id: z.string().uuid(),
});

export const deletePostSchema = z.object({
  id: z.string().uuid(),
});
