# FurnitureOps Distributed Safety Model

## 1. Idempotency Guarantees

We guarantee **At-Most-Once** execution for mutated inventory operations (POST/PATCH) via `Idempotency-Key` headers.

- **Storage**: Persistent PostgreSQL table `idempotency_keys` ensures consistency across distributed edge nodes.
- **Validation**: Request payloads are hashed (SHA-256). Token reuse with modified payloads triggers `409 Conflict`.
- **Expiration**: Keys remain valid for 60 seconds (Standard network partition retry window), preventing indefinite state locking.

## 2. Atomicity Guarantees

- **Inventory Mutations**: Stock decrements and sales increments occur within a single atomic PostgreSQL transaction (`decrement_stock_atomic`).
- **Audit Logging**: Audit entries are written within the _same_ transaction as the mutation. If the valid audit log cannot be written, the inventory change rolls back.
- **Isolation**: `FOR UPDATE` row locking prevents race conditions during concurrent stock checks.

## 3. Audit Immutability

Audit completeness is enforced at the database level.

- **RLS**: `INSERT` privileges are revoked from all public/authenticated roles.
- **Function-Only Writes**: Only `SECURITY DEFINER` functions in the `public` schema can write to `audit_logs`.
- **Read-Only**: No role (except superuser) has `UPDATE` or `DELETE` privileges on `audit_logs`.

## 4. Rate Limiting Guarantees

- **Strategy**: Distributed Token Bucket (via Redis/Upstash design) or Fallback In-Memory (per-instance).
- **Defense**:
  - IP-based limits (20 req/min).
  - Exponential Backoff for abuse patterns.
  - Idempotency Hash validation prevents Replay Attacks even within rate limits.

## 5. Failure Modes & Mitigation

| Failure Mode        | Mitigation                                                                                                       |
| :------------------ | :--------------------------------------------------------------------------------------------------------------- |
| **Edge Node Crash** | In-memory state lost, but DB Idempotency prevents replay on retry.                                               |
| **DB Partition**    | API returns 500. Client retries with same Idempotency Key.                                                       |
| **Replay Attack**   | Malicious retry of captured request fails Idempotency Check (if within window) or lacks auth/nonce (if outside). |
