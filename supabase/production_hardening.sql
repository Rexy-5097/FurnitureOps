-- PART A: Idempotency Crash Recovery
-- Add last_updated_at to track stale processing
ALTER TABLE idempotency_keys 
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW();

-- PART B: Distributed Rate Limiting (Supabase-Backed)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY, -- 'ip:path'
  count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access
-- (Implicitly denied for public)

-- Cleanup Function (Optional, can be called lazily or via separate cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM rate_limits WHERE expires_at < NOW();
$$;
