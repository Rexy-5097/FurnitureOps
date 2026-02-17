# Chaos Injection Test Plan

## 1. Controlled Failure Scenarios

### A. Database Timeout (Constraint Stress)

**Simulation**:

```sql
BEGIN;
SET LOCAL statement_timeout = '10ms';
-- Run Decrement RPC
COMMIT;
```

**Expected**:

- RPC throws `57014 query_canceled`.
- API returns `500`.
- **Invariant**: Stock MUST NOT change. Audit Log MUST NOT be written.

### B. Network Partition (RPC Failure)

**Simulation**:

- Block outbound requests to `supabase.co` in `middleware` or network layer for 5s.
  **Expected**:
- API throws `FetchError`.
- Client receives `503 Service Unavailable`.
- **Invariant**: No phantom writes.

### C. Kill Switch Spam (Abuse)

**Simulation**:

- Run `ab -n 100 -c 10 -p kill_payload.json -H "Authorization: Bearer ADMIN" /api/admin/kill-switch`
  **Expected**:
- First request: `200 OK` (Inventory cleared).
- Subsequent 99 requests: `429 Too Many Requests` (Cooldown triggered).
- **Invariant**: Audit Log shows approx 1 `KILL_SWITCH_ACTIVATED`, 0-5 duplicates max before lock reduces race.

### D. Concurrent Decrement Collision

**Simulation**:

- 2 Clients, 1 Item (Qty: 1).
- Both send `PATCH` decrement: 1 at exact same millisecond.
  **Expected**:
- C1: `200 OK` (New Qty: 0).
- C2: `409 Conflict` (Insufficient stock) OR `409 Conflict` (Idempotency if same key).
- **Invariant**: Qty never -1.

## 2. Pass/Fail Criteria

- **Zero Data Corruption**: `scripts/verify_invariants.ts` MUST pass after every run.
- **Zero Negative Stock**: Strictly enforced by DB constraints.
- **Availability Recovery**: System must accept normal traffic < 1s after chaos stops.
