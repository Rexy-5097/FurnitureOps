# FurnitureOps Consistency Contract

## 1. System Invariants

The following invariants must hold true at all times, enforced by database constraints and atomic RPCs.

### Quantities

- **Non-Negative Availability**: `quantity_available` must never be less than 0.
  - _Enforcement_: `CHECK (quantity_available >= 0)` constraint in PostgreSQL.
- **Monotonic Sales**: `quantity_sold` must be monotonically increasing (except during authorized system resets).
  - _Enforcement_: RPC logic only increments or resets.
- **Atomic Decrement**: Stock reduction and sales increment must happen in a single, isolated transaction.
  - _Enforcement_: `decrement_stock_atomic` stored procedure with `FOR UPDATE` locking.

### Audit Trail

- **Append-Only**: Audit logs are immutable and strictly append-only.
  - _Enforcement_: `REVOKE UPDATE/DELETE` for all roles. RLS prevents modifications.
- **Traceability**: Every write operation (Inventory UPDATE/DELETE) must have a corresponding Audit Log entry.
  - _Enforcement_: Transactional RPCs ensure atomicity of Action + Log.

### Kill Switch

- **Atomic Reset**: The System Reset (Kill Switch) must wipe inventory and log the event in a single transaction.
  - _Enforcement_: `reset_inventory_atomic` RPC.

## 2. Failure Modes

- **RPC Failure**: If an RPC fails (e.g., DB constraint), the entire transaction rolls back. Client receives 4xx/5xx.
- **Network Partition**: Clients will retry with exponential backoff. Idempotency keys prevent duplicate processing.
