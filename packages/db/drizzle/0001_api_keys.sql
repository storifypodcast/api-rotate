-- API Keys table for encrypted key rotation management
CREATE TABLE IF NOT EXISTS "api_key" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "encrypted_key" text NOT NULL,
  "type" text,
  "default_cooldown" integer NOT NULL DEFAULT 30,
  "is_active" boolean NOT NULL DEFAULT true,
  "available_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz,
  "use_count" bigint NOT NULL DEFAULT 0,
  "error_count" bigint NOT NULL DEFAULT 0,
  "consecutive_errors" integer NOT NULL DEFAULT 0,
  "last_error_at" timestamptz,
  "last_error_message" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient key selection
CREATE INDEX IF NOT EXISTS "api_key_available_idx"
  ON "api_key" ("available_at");

CREATE INDEX IF NOT EXISTS "api_key_type_available_idx"
  ON "api_key" ("type", "available_at");

-- Atomic function: Get first available key (ordered by available_at)
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions
CREATE OR REPLACE FUNCTION get_first_available_key(
  type_filter text DEFAULT NULL,
  cooldown_seconds integer DEFAULT NULL
)
RETURNS TABLE(
  key_id uuid,
  encrypted_key text,
  key_type text
)
LANGUAGE plpgsql
AS $$
DECLARE
  selected_id uuid;
  selected_encrypted_key text;
  selected_type text;
  selected_default_cooldown integer;
  actual_cooldown integer;
  next_available timestamptz;
BEGIN
  -- Select and lock a single available key
  SELECT ak.id, ak.encrypted_key, ak.type, ak.default_cooldown
  INTO selected_id, selected_encrypted_key, selected_type, selected_default_cooldown
  FROM api_key ak
  WHERE ak.is_active = true
    AND ak.available_at <= now()
    AND (type_filter IS NULL OR ak.type = type_filter)
  ORDER BY ak.available_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If no key found, return empty
  IF selected_id IS NULL THEN
    RETURN;
  END IF;

  -- Use provided cooldown or key's default
  actual_cooldown := COALESCE(cooldown_seconds, selected_default_cooldown);
  next_available := now() + (actual_cooldown * interval '1 second');

  -- Update the selected key
  UPDATE api_key
  SET
    available_at = next_available,
    use_count = use_count + 1,
    last_used_at = now(),
    -- Gradual recovery: decrement consecutive errors on successful use
    consecutive_errors = CASE WHEN consecutive_errors > 0 THEN consecutive_errors - 1 ELSE 0 END,
    updated_at = now()
  WHERE id = selected_id;

  -- Return the result
  key_id := selected_id;
  encrypted_key := selected_encrypted_key;
  key_type := selected_type;
  RETURN NEXT;
END;
$$;

-- Atomic function: Get random available key
CREATE OR REPLACE FUNCTION get_random_available_key(
  type_filter text DEFAULT NULL,
  cooldown_seconds integer DEFAULT NULL
)
RETURNS TABLE(
  key_id uuid,
  encrypted_key text,
  key_type text
)
LANGUAGE plpgsql
AS $$
DECLARE
  selected_id uuid;
  selected_encrypted_key text;
  selected_type text;
  selected_default_cooldown integer;
  actual_cooldown integer;
  next_available timestamptz;
BEGIN
  -- Select and lock a random available key
  SELECT ak.id, ak.encrypted_key, ak.type, ak.default_cooldown
  INTO selected_id, selected_encrypted_key, selected_type, selected_default_cooldown
  FROM api_key ak
  WHERE ak.is_active = true
    AND ak.available_at <= now()
    AND (type_filter IS NULL OR ak.type = type_filter)
  ORDER BY random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If no key found, return empty
  IF selected_id IS NULL THEN
    RETURN;
  END IF;

  -- Use provided cooldown or key's default
  actual_cooldown := COALESCE(cooldown_seconds, selected_default_cooldown);
  next_available := now() + (actual_cooldown * interval '1 second');

  -- Update the selected key
  UPDATE api_key
  SET
    available_at = next_available,
    use_count = use_count + 1,
    last_used_at = now(),
    consecutive_errors = CASE WHEN consecutive_errors > 0 THEN consecutive_errors - 1 ELSE 0 END,
    updated_at = now()
  WHERE id = selected_id;

  -- Return the result
  key_id := selected_id;
  encrypted_key := selected_encrypted_key;
  key_type := selected_type;
  RETURN NEXT;
END;
$$;

-- Function: Report error with exponential backoff (atomic single UPDATE)
-- Backoff formula: min(key.default_cooldown * 2^consecutive_errors, max_delay)
-- Uses single UPDATE to avoid race conditions between concurrent error reports
CREATE OR REPLACE FUNCTION report_key_error(
  key_id_param uuid,
  error_message_param text DEFAULT NULL,
  max_delay integer DEFAULT 14400  -- 4 hours max
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Atomic UPDATE: PostgreSQL evaluates RHS using old values before applying changes
  -- So consecutive_errors in POWER() is the value BEFORE increment
  UPDATE api_key
  SET
    error_count = error_count + 1,
    consecutive_errors = consecutive_errors + 1,
    last_error_at = now(),
    last_error_message = error_message_param,
    available_at = now() + (LEAST(default_cooldown * POWER(2, consecutive_errors), max_delay) * interval '1 second'),
    updated_at = now()
  WHERE id = key_id_param;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- Function: Get key statistics (pure SQL, no plpgsql overhead)
CREATE OR REPLACE FUNCTION get_api_key_stats()
RETURNS TABLE(
  total_keys bigint,
  active_keys bigint,
  available_now bigint,
  total_uses bigint,
  total_errors bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*)::bigint AS total_keys,
    COUNT(*) FILTER (WHERE is_active = true)::bigint AS active_keys,
    COUNT(*) FILTER (WHERE is_active = true AND available_at <= now())::bigint AS available_now,
    COALESCE(SUM(use_count), 0)::bigint AS total_uses,
    COALESCE(SUM(error_count), 0)::bigint AS total_errors
  FROM api_key;
$$;
