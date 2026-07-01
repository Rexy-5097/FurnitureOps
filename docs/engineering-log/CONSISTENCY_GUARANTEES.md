# FurnitureOps Consistency Guarantees

## 1. Safety & Correctness

### Exactly-Once Semantics (Side Effects)

We enforce **Exactly-Once** semantics for all inventory mutations (Decrement, Reset) via the `Idempotency-Key` mechanism.

- **Mechanism**: Insert-First Locking Pattern.
- **Guarantee**: A given operation identified by a client-generated UUID `Idempotency-Key` will be executed effectively once. Subsequent retries will return the persisted result of the original execution without re-triggering side effects.

### Atomicity (Database)

- **Stock Operations**: Covered by `decrement_stock_atomic` RPC. The `UPDATE inventory` and `INSERT audit_logs` occur in a single transaction.
- **System Reset**: Covered by `reset_inventory_atomic` RPC. `DELETE` and `audit` occur in a single transaction.
- **Failure Atomicity**: If any part of the transaction fails (e.g., Audit Insert fails due to disk full), the entire operation rolls back.

## 2. Isolation & Concurrency

### Row-Level Locking

- We utilize `FOR UPDATE` in our RPCs to lock specific inventory rows during mutation.
- This prevents "Lost Update" anomalies where two concurrent decrements read the same `quantity_available` before writing.
- **Isolation Level**: Read Committed (Postgres Default), elevated to Serializable-like behavior for single-row mutations via explicit locking.

## 3. Audit Immutability

- Audit logs are **Append-Only**.
- No application role has `UPDATE` or `DELETE` permissions on the `audit_logs` table.
- This ensures a tamper-evident history of all state changes.

## 4. Replay Resistance

- **Token Uniqueness**: Idempotency keys are globally unique per request hash.
- **Payload Binding**: Keys are cryptographically bound to the SHA-256 hash of the request body. Mismatched payloads with the same key are rejected (`409 Conflict`).
