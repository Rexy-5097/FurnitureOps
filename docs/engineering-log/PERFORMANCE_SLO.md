# Production Performance SLOs & Budgeting

## 1. Latency Targets (P99)

| Route Type                           | Target (P99) | Hard Limit | Justification                                     |
| :----------------------------------- | :----------- | :--------- | :------------------------------------------------ |
| **Public Read** (`GET /inventory`)   | **150ms**    | 400ms      | UX "Instant" feel. Cached at Edge where possible. |
| **Admin Write** (`PATCH /inventory`) | **300ms**    | 800ms      | Includes DB Write + Audit + Idempotency Overhead. |
| **Auth Verification**                | **50ms**     | 100ms      | Optimized Local JWT. No DB RTT unless Role check. |
| **Kill Switch**                      | **500ms**    | 2000ms     | High-consistency operation. Reliability > Speed.  |

## 2. Resource Budgets

### Database (Supabase / Postgres)

- **Max Queries per Request**: 3
  - 1. Auth/Role Check (Indexed)
  - 2. Main Operation (Read/Write)
  - 3. Audit Log (via RPC or Side-effect)
- **Connection Poll**: Max 20 active connections per functional instance (pgBouncer used).

### Compute (Vercel Edge/Serverless)

- **Memory**: 128MB (Standard Function limit).
- **Execution Time**: < 1s (Edge), < 10s (Serverless).

## 3. RPC Cost Analysis

| RPC                      | Cost              | Frequency        | Optimization                  |
| :----------------------- | :---------------- | :--------------- | :---------------------------- |
| `decrement_stock_atomic` | Medium (Locking)  | High (Sales)     | Batched if possible (future). |
| `reset_inventory_atomic` | High (Table Lock) | Rare (Emergency) | None needed.                  |

## 4. Monitoring Strategy

- **Datadog / Logflare**: Track `durationMs` from JSON logs.
- **Alerts**:
  - P99 > 500ms for 5m -> **Warn**
  - Error Rate > 1% -> **CriticalPager**
