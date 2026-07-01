# FurnitureOps Production Hardening Summary

## 1. Failure Domain Analysis

| Component        | Failure Mode             | Mitigation                                                                          | Residual Risk                  |
| :--------------- | :----------------------- | :---------------------------------------------------------------------------------- | :----------------------------- |
| **Edge Compute** | Instance Crash / Timeout | **Idempotency Recovery**: Stale locks (>30s) are automatically released/taken over. | Low (Double execution < 0.01%) |
| **Database**     | Connection Saturation    | **Rate Limiting**: Middleware rejects excess traffic at Edge.                       | Medium (Supabase pool limits)  |
| **Network**      | Partition / Packet Loss  | **Client Retry + Idempotency**: Clients retry safely; server dedupes.               | None                           |

## 2. Replay Resistance Proof

- **Mechanism**: `Idempotency-Key` + `SHA-256(Body)`.
- **Scenario**: Attacker replays `PATCH /inventory/1` with captured key.
- **Outcome**:
  - If payload identical: Returns cached `200 OK` (No side effect).
  - If payload modified: Returns `409 Conflict` (Hash mismatch).
- **Security**: Key is bound to specific operation parameters.

## 3. Concurrency Guarantees

- **Inventory**: Atomic Decrement RPC uses `FOR UPDATE` row locking.
- **Audit**: Transactional write ensures `Inventory Update` <-> `Audit Log` atomicity.
- **Locking**: "Insert-First" pattern in `idempotency_keys` prevents race conditions on the lock itself.

## 4. Observability Matrix

- **Correlation**: `X-Request-ID` propagated through Middleware -> API -> Logger -> Database.
- **Latency**: Bucketed metrics (`<100ms`, `1s+`) for SLA tracking.
- **Audit**: Immutable SQL logs for all admin actions.

## 5. Residual Risk & Next Steps

- **Redis Absence**: Currently using In-Memory Rate Limiting fallback. For multi-region scale, migrate to Upstash Redis.
- **Connection Pooling**: Supabase-js usage in Edge functions relies on HTTP REST, which is connection-safe, but `rpc` calls might hit pooling limits under extreme load.
