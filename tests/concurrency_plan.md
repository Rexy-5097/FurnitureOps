# Concurrency Stress Simulation Plan

## Objective

Verify that the `idempotency_keys` table and `lockIdempotency` logic prevent double-execution under high concurrency.

## Test Cases

### 1. The "Thundering Herd" (Same Token, Same Payload)

**Scenario**: Fire 50 concurrent `PATCH /api/inventory/123` requests with `Idempotency-Key: test-uuid-1` and `decrement: 1`.
**Expectation**:

- **1 Request** succeeds (Returns 200, Decrements stock).
- **49 Requests** fail with 409 (Processing) or Return 200 (Cached Result) depending on timing.
- **Stock** decreases by exactly 1.
- **Audit Log**: Exactly 1 entry.

### 2. The "Malicious Replay" (Same Token, Different Payload)

**Scenario**:

1. `PATCH ... { decrement: 1 }` with Key A. (Success).
2. `PATCH ... { decrement: 500 }` with Key A.
   **Expectation**:

- Request 2 returns `409 Conflict` ("Idempotency key reused with different payload").
- Stock does not change further.

### 3. The "Kill Switch" Race

**Scenario**: Two admins hit "Reset" simultaneously with the same Key (frontend logic usually avoids this, but API clients might not).
**Expectation**:

- Only ONE reset command executes RPC.
- Second command returns cached success message.
- Audit Log shows 1 `KILL_SWITCH_ACTIVATED`.

## Observability Signals

- **Logs**: grep for `IDEMPOTENCY_HIT` vs `Stock decremented`.
- **Database**: `SELECT count(*) FROM idempotency_keys WHERE key = 'test-uuid-1'` should be 1.
