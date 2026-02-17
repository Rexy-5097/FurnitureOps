# Incident Response Runbook

## 1. Database Compromise

**Detection**: Abnormal CPU usage, unexpected new tables/functions, connection from unknown IP.
**Immediate Action**:

1. **Rotate Secrets**: Immediate rotation of `SUPABASE_SERVICE_ROLE_KEY` and `POSTGRES_PASSWORD`.
2. **Pause Access**: Enable "Maintenance Mode" (Deploy static 503 page).
3. **Audit**: Review `audit_logs` and `pg_stat_activity`.
   **Long-term Fix**: Restore from PITR (Point-in-Time Recovery). Harden firewall.

## 2. Service Role Leaked in Client

**Detection**: `runtime-check` logs "Key detected in public variable" OR User report.
**Immediate Action**:

1. **Rotate Key**: Revoke compromised Service Key in Supabase Dashboard.
2. **Redeploy**: Fix code and redeploy immediately.
3. **Invalidate Sessions**: `UPDATE auth.sessions SET not_after = NOW()` (Force logout).
   **Long-term Fix**: Add automated linting rule for `process.env` assignment.

## 3. Admin Account Hijacked

**Detection**: Anomalous `KILL_SWITCH` or `DELETE` activity.
**Immediate Action**:

1. **Block User**: `UPDATE auth.users SET banned_until = 'infinity' WHERE id = ...`
2. **Revoke Sessions**: `supabase.auth.admin.signOut(uid)`.
   **Long-term Fix**: Enforce MFA for admins.

## 4. Replay Attack Detected

**Detection**: Spikes in `409 Conflict` on Idempotency Keys.
**Immediate Action**:

1. **Rate Limit**: Tighten IP bans in Middleware.
2. **Analyze**: Check if payloads are identical (User Retry) or modified (Attacker).
   **Long-term Fix**: Implement cryptographic signatures (HMAC) on critical payloads.

## 5. Rate Limit Bypass

**Detection**: Traffic exceeding theoretical max (e.g. distributed botnet).
**Immediate Action**:

1. **Enable Captcha**: Turn on Cloudflare / Turnstile.
2. **Geo-Block**: Block traffic from non-target regions via Vercel/Supabase Firewall.
   **Long-term Fix**: Migrate to Upstash Redis for global distributed counting.
