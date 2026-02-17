-- Idempotency Table for Distributed Consistency
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '60 seconds') STORED
);

-- Index for expiration cleanup (if we had a cron)
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- RLS: Only Service Role can access (Admin API uses Service Role)
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- No policies needed if we only use Service Role. 
-- But to be safe & explicit:
DROP POLICY IF EXISTS "Service Role Full Access" ON idempotency_keys;
-- (Implicitly denied for public/anon/authenticated without policies)
