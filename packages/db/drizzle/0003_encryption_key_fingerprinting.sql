-- Encryption key fingerprinting migration
-- Adds the ability to validate and track encryption keys

-- ============================================
-- Step 1: Add key_fingerprint to api_key table
-- ============================================

-- Add nullable fingerprint column (null for legacy keys)
ALTER TABLE api_key ADD COLUMN IF NOT EXISTS "key_fingerprint" text;

-- ============================================
-- Step 2: Create encryption_key_info table
-- ============================================

CREATE TABLE IF NOT EXISTS "encryption_key_info" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "key_fingerprint" text NOT NULL,
  "validation_token" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("user_id")
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS "encryption_key_info_user_idx" ON encryption_key_info(user_id);
