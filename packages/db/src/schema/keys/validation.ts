import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { apiKey } from "./api-key";
import { serviceKey } from "./service-key";

// ============================================
// API Key Schemas
// ============================================

// Select schema (for reading)
export const selectApiKeySchema = createSelectSchema(apiKey);

// Insert schema (for creating new keys)
// Note: userId is omitted because it's set by the server from authenticated user
export const insertApiKeySchema = createInsertSchema(apiKey, {
  name: (schema) => schema.min(1).max(100),
  encryptedKey: (schema) => schema.min(1), // Already encrypted by client
  type: (schema) => schema.max(50).optional(),
  defaultCooldown: (schema) => schema.min(1).max(14400).default(30),
}).omit({
  id: true,
  userId: true, // Set by server from authenticated user
  availableAt: true,
  lastUsedAt: true,
  useCount: true,
  errorCount: true,
  consecutiveErrors: true,
  lastErrorAt: true,
  lastErrorMessage: true,
  createdAt: true,
  updatedAt: true,
});

// Update schema (for admin updates)
export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.string().max(50).optional().nullable(),
  defaultCooldown: z.number().min(1).max(14400).optional(),
  isActive: z.boolean().optional(),
});

// Get key options
export const getKeyOptionsSchema = z.object({
  type: z.string().optional(),
  cooldownSeconds: z.number().min(1).max(14400).optional(), // If omitted, uses key's default_cooldown
});

// Report error schema
export const reportErrorSchema = z.object({
  keyId: z.string().uuid(),
  errorMessage: z.string().max(500).optional(),
});

// ============================================
// Service Key Schemas
// ============================================

// Select schema (for reading)
export const selectServiceKeySchema = createSelectSchema(serviceKey);

// Create service key schema (input from user)
export const createServiceKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// ============================================
// Types
// ============================================

// API Key types
export type ApiKey = z.infer<typeof selectApiKeySchema>;
export type NewApiKey = z.infer<typeof insertApiKeySchema>;
export type UpdateApiKey = z.infer<typeof updateApiKeySchema>;
export type GetKeyOptions = z.infer<typeof getKeyOptionsSchema>;
export type ReportError = z.infer<typeof reportErrorSchema>;

// Service Key types
export type ServiceKey = z.infer<typeof selectServiceKeySchema>;
export type CreateServiceKey = z.infer<typeof createServiceKeySchema>;
