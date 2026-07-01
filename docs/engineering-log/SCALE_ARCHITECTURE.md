# Scale Architecture & Evolution Plan

## 1. System Classification: **Series A Ready**

### Justification

- **Strengths**: Robust correctness (Idempotency, Audit Logs, Atomic RPCs), excellent observability (`X-Request-ID`, JSON logs), and strong abuse containment (Kill Switch Cooldown, JWT Checks).
- **Limitations**:
  - **Single-Row Write Throughput**: The `inventory` row lock (`FOR UPDATE`) caps throughput at ~100-500 TPS per item depending on DB hardware.
  - **Edge State Isolation**: In-memory Rate Limiting is per-isolate, susceptible to distributed attacks (DDoS) without Redis.
  - **Database Dependency**: Heavy reliance on Supabase/Postgres for every operation (Roles, Audit, Idempotency) creates a single point of vertical scaling pressure.
- **Verdict**: The system is rock-solid for a high-growth startup ($1M-$10M ARR) but requires architectural evolution for "Enterprise" scale (1M+ Users / Global Multi-Region).

---

## 2. Bottleneck Analysis (Stress Test: 500 TPS / 10k Users)

### A. Database Row Contention (Critical)

- **Scenario**: 500 users simultaneously buy "Ergonomic Chair (ID: 123)".
- **Impact**:
  - Postgres serializes `UPDATE inventory` via `RowExclusiveLock`.
  - 500 tx/sec queue up. Latency spikes from 50ms to >2000ms.
  - `statement_timeout` triggers 500s errors.
- **Risk**: High. Hot items will bring down the DB pool.

### B. Idempotency Table Growth

- **Rate**: 500 writes/sec = 1.8M rows/hour.
- **Impact**:
  - `SELECT * FROM idempotency_keys WHERE key = ...` index scans become slower as B-Tree depth increases.
  - Vacuuming becomes aggressive, consuming IOPS.
  - Cleanup job (`DELETE FROM ...`) generates massive WAL logs.

### C. Connection Pooling

- **Limit**: Supabase Transaction Pool (pgBouncer) -> ~60-100 concurrent transactions.
- **Load**: 500 req/sec \* 100ms duration = 50 concurrent connections.
- **Risk**: Medium. Traffic spikes (e.g., Marketing push) will exhaust pool immediately.

### D. JWT Role Verification

- **Current**: Validating Admin role hits `admins` table (Indexed Read).
- **Load**: 10k Admin requests/sec = 10k SELECTs/sec.
- **Risk**: High. Unnecessary DB load.

---

## 3. Scale Upgrade Blueprint

### A. Distributed Rate Limiting (Redis)

- **Problem**: Edge memory is isolated.
- **Solution**: Replace In-Memory Map with **Upstash Redis**.
- **Implementation**:
  - Use `@upstash/ratelimit` in Middleware.
  - Algorithm: Sliding Window Log.
  - Latency: ~30-50ms (Edge -> Redis).
  - **Benefit**: Global protection against distributed scrapers/attacks.

### B. Read Scaling (Read Replicas)

- **Problem**: 10k users browsing inventory floods the Primary DB.
- **Solution**: **Supabase Read Replicas**.
- **Change**:
  - Point `GET /inventory` to Replica URL (`aws-0-eu-central-1.pooler.supabase.com`).
  - Keep `PATCH` on Primary.
  - **Caveat**: 100ms replication lag means users might see "Old Stock". Acceptable for listing; strict check happens on Buy.

### C. Async Write Queue (Start of "Enterprise")

- **Problem**: Hot Row Contention.
- **Solution**: **Deferred Inventory Updates**.
- **Architecture**:
  1. **API**: `POST /buy` -> Pushes job to **Supabase Queues** (pg_mq) or **Redis Stream**.
  2. **Worker**: Consumes batch (e.g., 50 orders).
  3. **Batch Update**: `UPDATE inventory SET quantity = quantity - $1 ...`.
  4. **Notify**: Updates Realtime / Websocket for frontend.
- **Benefit**: Compresses 50 writes into 1 DB Transaction. Throughput up 50x.

### D. Idempotency Partitioning

- **Solution**: **Postgres Native Partitioning (Range)**.
- **Strategy**: Partition by `created_at` (Daily).
- **Benefit**: `DROP TABLE idempotency_2026_02_11` is instantaneous (O(1)). No vacuum overhead.

---

## 4. Cost Model (Monthly Estimate)

### Assumptions

- **Traffic**: 500 TPS writes, 2000 TPS reads. 12 hours/day active.
- **Data**: 1KB per request.

| Component              | Tier / Usage                        | Est. Cost      |
| :--------------------- | :---------------------------------- | :------------- |
| **Supabase (DB)**      | **Pro Plan + Compute Add-on (4XL)** | $800/mo        |
| **Supabase (Storage)** | 1TB Audit Logs                      | $50/mo         |
| **Read Replicas**      | 2 Replicas                          | $200/mo        |
| **Vercel (Compute)**   | Pro + 500M Edge Requests            | $1,500/mo      |
| **Redis (Upstash)**    | Enterprise (1B cmds/mo)             | $400/mo        |
| **Logging (Datadog)**  | Log Ingestion (High Volume)         | $2,000/mo      |
| **Total**              |                                     | **~$5,000/mo** |

**Cost Levers**:

1. **Sampled Logging**: Log only 1% of 200 OKs, 100% of Errors. Saves $1800/mo.
2. **Aggressive Caching**: Cache `GET /inventory` on Vercel Edge for 1s. Reduces DB Reads by 90%.

---

## 5. Multi-Tenant Evolution Plan (SaaS)

**Goal**: Support multiple shops (Tenants) with strict isolation.

### Phase 1: Schema Evolution

1.  **Add `organization_id`**:
    ```sql
    ALTER TABLE inventory ADD COLUMN organization_id UUID REFERENCES organizations(id);
    ALTER TABLE audit_logs ADD COLUMN organization_id UUID;
    -- Composite Primary Keys for performance/sharding
    ALTER TABLE inventory DROP CONSTRAINT inventory_pkey;
    ALTER TABLE inventory ADD CONSTRAINT inventory_pkey PRIMARY KEY (organization_id, id);
    ```

### Phase 2: RLS Policy Injection

1.  **Token Claims**:
    - Update Auth to include `org_id` in JWT `app_metadata`.
2.  **RLS Enforcement**:
    ```sql
    CREATE POLICY "Tenant Isolation" ON inventory
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);
    ```

    - **Result**: `SELECT * FROM inventory` automatically filters by Tenant. Zero code change in API queries.

### Phase 3: Domain Mapping (Edge Middleware)

1.  **Middleware**: Detect `shop.furnitureops.com`.
2.  **Rewrite**: Rewrite to `/api/tenant/[org_id]/inventory`.
3.  **Lookup**: Cached Redis map `domain -> org_id`.

---

## 6. Final Recommendation

**Go-Live Decision**: **APPROVED for Series A Launch.**
No immediate re-architecture needed for first 10k users _unless_ they are all buying the exact same item at the exact same second. If creating "Ticketmaster for Furniture", implement **Queue-Based Writes** immediately. Otherwise, current atomic locks are sufficient and safe.
