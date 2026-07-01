# Chaos Testing & Abuse Simulation Plan

## 1. Simulated Failures

### A. Database Timeout

**Simulation**:

- Determine `statement_timeout` on Postgres role.
- Run `SET statement_timeout = '1ms'` inside a transaction via SQL client or Migration.
  **Expected**:
- API returns `500` or `503`.
- Logger records `DB_ERROR`.
- Client shows "Please try again".

### B. Supabase Auth Outage

**Simulation**:

- Block `supabase.auth` calls (mock error in `auth-guard`).
  **Expected**:
- Local JWT Verify (`verifySupabaseToken`) **SUCCEEDS** (Resilience Win!).
- Role Check (`admins` table) might fail if DB is also down.
- **Result**: Valid traffic passes Auth, fails at Role Check (Fail Closed).

### C. Retry Storm (Thundering Herd)

**Simulation**:

- Use `k6` or `artillery` to send 1000 concurrent requests to `GET /api/inventory`.
- Trigger 100 concurrent Realtime updates.
  **Expected**:
- Frontend: Debounce logic prevents 100x Refetches.
- Backend: Read Replica absorbs `GET` load (if configured), or Connection Limit hit.
- Middleware: Rate Limiter rejects excess (>20/min/IP).

## 2. Security "Red Team" Scenarios

### A. Idempotency Brute Force

**attack**: Send `PATCH /inventory/1` with valid Key but changing payloads rapidly.
**Defense**:

- Hash Check fails (409).
- Rate Limit kicks in.
- **Result**: No Data Corruption.

### B. Kill Switch Spam

**Attack**: Script hits `POST /api/admin/kill-switch` 100 times/sec.
**Defense**:

- Middleware "Sensitive Route" block (>5 reqs).
- **Result**: RPC never called. DB spared.

## 3. Monitoring Validation

- Verify `X-Request-ID` appears in every single log line during attack.
- Verify `latencyBucket` shifts to `1s+` during DB timeout tests.
