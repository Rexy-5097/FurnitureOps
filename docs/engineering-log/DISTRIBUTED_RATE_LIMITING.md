# Distributed Safe Rate Limiting Architecture

## Problem Statement

In a distributed serverless environment (Vercel Edge/Serverless Functions), in-memory rate limiting (Map) is insufficient because:

1.  **State Isolation**: Memory is not shared between lambda instances.
2.  **Cold Starts**: State is lost when instances spin down.
3.  **Scalability**: High concurrency spins up multiple isolated instances, allowing users to exceed limits by hitting different nodes.

## Proposed Solutions

### Option A: Redis / Upstash (Recommended)

Use a low-latency, persistent Key-Value store like Upstash Redis (HTTP based, Edge compatible).

- **Mechanism**: Sliding Window Log or Fixed Window Counter (Lua Script).
- **Key**: `rate_limit:${ip}:${path}`
- **Pros**:
  - Sub-millisecond latency.
  - Atomic increment operations.
  - Edge-ready (Global replication).
- **Cons**: External dependency, cost.

### Option B: Supabase Table

Use a PostgreSQL table `rate_limits` with `ip`, `path`, `timestamp`.

- **Mechanism**: `SELECT count(*) FROM rate_limits WHERE ip = $1 AND timestamp > NOW() - INTERVAL '1 minute'`.
- **Pros**: Reuse existing infrastructure.
- **Cons**: High latency (DB RTT), database connection exhaustion under load, heavy WRITE load (INSERT per request). **Not recommended for high-volume edge middleware.**

## Chosen Architecture: Token Bucket via Redis (Upstash)

To ensure production resilience without DB load:

1.  **Middleware** checks Redis for `rate_limit:${ip}`.
2.  **Atomic Lua Script**:
    - Check tokens.
    - If tokens > 0, decrement and allow.
    - If tokens == 0, return 429.
    - Refill tokens based on time delta.
3.  **Fallback**: If Redis fails, fail _open_ (allow request) or use strict local memory fallback to prevent service outage.

## Replay Attack Prevention

Combined with Idempotency:

- **Idempotency Key** stored in Redis with 24h TTL.
- Hash of request body validated against stored hash.
