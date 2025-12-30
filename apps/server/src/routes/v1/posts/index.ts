import { Hono } from "hono";

import { authMiddleware } from "~/libs/middlewares";

import { createPost } from "./create";
import { deletePost } from "./delete";
import { getAllPosts } from "./get-all";
import { getPostById } from "./get-by-id";

export const postsRouter = new Hono();

// Public routes
postsRouter.get("/", getAllPosts);
postsRouter.get("/:id", getPostById);

// Protected routes
postsRouter.post("/", authMiddleware, createPost);
postsRouter.delete("/:id", authMiddleware, deletePost);
