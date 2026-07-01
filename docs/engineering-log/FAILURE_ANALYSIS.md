# FurnitureOps Failure Domain & Consistency Proof

## 1. Lost Update Prevention

**Scenario**: Two concurrent admins decrement stock for the same Item ID.
**Proof**:

- All mutations use `FOR UPDATE` locking on the `inventory` row.
- T1 acquires lock. T2 blocks.
- T1 reads `quantity`, decrements, commits.
- T2 unblocks, reads _new_ `quantity`, decrements, commits.
- **Result**: Consistent state. No overwrite of unread data.

## 2. Replay Attack Prevention (Idempotency)

**Scenario**: Network partition causes Client to retry a successful `PATCH`.
**Proof**:

- **Phase 1 (Lock)**: Request A inserts `idempotency_key` (Status 202).
- **Phase 2 (Mutation)**: RPC updates Inventory + Audit + Idempotency (Status 200).
- **Phase 3 (Retry)**: Request A' (Retry) hits `lockIdempotency`.
  - Detects Key Exists -> Checks Status.
  - Status is 200 -> Returns cached Response Body.
- **Result**: Zero side-effect replay.

## 3. Crash Recovery Model

**Scenario**: Server crashes _during_ Phase 2 (Mutation).
**Proof**:

- **Case A: Crash BEFORE Commit**: DB Transaction rolls back. Inventory untouched. Idempotency Key remains 202 (Inserted in Phase 1).
  - **Recovery**: Client Retries. `claim_stale_idempotency_key` detects 202 > 30s. Atomic Update grabs lock. Retry proceeds.
- **Case B: Crash AFTER Commit**: N/A (Atomic Commit). If commit happened, DB is updated.
- **Case C: Crash during Lock**: Insert fails or doesn't persist. Client Retry -> Fresh Insert.

## 4. Distributed Retry Behavior

- **Client**: Must generate `Idempotency-Key` (UUIDv4).
- **Middleware**: Backoff on 429s.
- **Server**: Returns 409 for "In Progress" to prevent Thundering Herd (only one worker processes a key at a time).

## 5. Residual Risk

- **Clock Skew**: 30s takeover relies on DB time (NOW()). Safe as single source of truth.
- **Key Eviction**: If keys are deleted (60s TTL) before a _very_ late retry (e.g. 2 mins), it looks like a new request.
  - **Mitigation**: Client timeout should be < 60s.
