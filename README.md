# FurnitureOps: Enterprise Inventory RPC

[![Build Status](https://img.shields.io/github/actions/workflow/status/Rexy-5097/FurnitureOps/ci.yml?style=flat-square&logo=github)](https://github.com/Rexy-5097/FurnitureOps/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Production-black?style=flat-square&logo=vercel)](https://furniture-ops.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com)
[![Redis](https://img.shields.io/badge/Redis-Upstash-red?style=flat-square&logo=redis)](https://upstash.com)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened-blueviolet?style=flat-square&logo=security)](SECURITY.md)

> **Corporate Inventory Management System** designed for high-concurrency, atomic consistency, and distributed reliability.

**FurnitureOps** is a production-grade SaaS platform for managing enterprise inventory. It enforces strict consistency guarantees through atomic RPCs, queue-based writes, and distributed locking, ensuring zero data loss even under high concurrency or network partitions.

---

## 🏗 Architecture

The system follows a **Cloud-Native Serverless** architecture, prioritizing stateless computation and delegated state management.

```mermaid
graph TD
    Client[Client PWA] -->|Atomic RPC| Next[Next.js API (Serverless)]
    Next -->|Rate Limit Check| Redis[Upstash Redis]
    Next -->|Auth Guard| Auth[Supabase Auth]
    Next -->|Atomic Transaction| DB[(Supabase Postgres)]

    subgraph "Consistency Layer"
        DB -->|RPCS| Functions[Postgres Functions]
        Functions -->|Audit Log| Audit[Immutable Audit Trail]
    end

    subgraph "Resilience"
        Redis -->|Idempotency Key| Lock[Distributed Lock]
    end
```

## 🚀 Key Capabilities

| Capability             | Description                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Atomic RPC**         | All inventory mutations occur via stored procedures (`rpc`), ensuring ACID compliance and prohibiting partial failures. |
| **Idempotency**        | Distributed locking via Redis ensures that network retries or double-clicks never corrupt state.                        |
| **Queue-Based Writes** | High-load operations are queued to prevent database saturation during peak traffic.                                     |
| **Rate Limiting**      | Token-bucket algorithms protect the API from abuse and denial-of-service attacks.                                       |
| **RLS Security**       | Row Level Security (RLS) policies enforce isolated multi-tenant access at the database kernel level.                    |
| **Audit Immutability** | Every mutation generates a cryptographically verifiable audit log entry that cannot be altered.                         |
| **Observability**      | Structured logging and distributed tracing provide deep visibility into system health.                                  |

## 🛠 Tech Stack

| Component       | Technology              | Rationale                                                      |
| --------------- | ----------------------- | -------------------------------------------------------------- |
| **Frontend**    | Next.js 14 (App Router) | Server Components, Streaming, and Edge capabilities.           |
| **Language**    | TypeScript              | Type safety across the entire stack.                           |
| **Database**    | Supabase (PostgreSQL)   | Relational integrity with JSON support and RLS.                |
| **Cache/Queue** | Upstash Redis           | Serverless Redis for rate limiting and locks.                  |
| **Auth**        | Supabase Auth           | Secure, standards-compliant authentication (OAuth/Magic Link). |
| **Deployment**  | Vercel                  | Global edge network and instant scaling.                       |

## 📊 Performance SLOs

We adhere to strict Service Level Objectives for production traffic:

- **Availability**: 99.9% uptime during business hours.
- **Latency (P95)**: < 150ms for read operations.
- **Latency (P99)**: < 500ms for write operations (including consistency checks).
- **Throughput**: Support for 1,000 concurrent active users.
- **Data Durability**: RPO (Recovery Point Objective) of 0 seconds for committed transactions.

## 🔐 Security Model

1.  **Zero Trust**: No component trusts another implicitly. All internal APIs require signed JWTs.
2.  **Least Privilege**: Database roles are scoped strictly to necessary operations.
3.  **Input Sanitation**: All inputs are validated with Zod schemas before processing.
4.  **CSP**: Strict Content Security Policy headers to prevent XSS.

See [SECURITY.md](SECURITY.md) for full details.

## 🧪 Load Test Results

Recent load testing (`scripts/test-load.ts`) against the production environment validated:

- **100 Concurrent Users** performing simultaneous inventory updates.
- **100% Data Integrity**: No race conditions or lost updates.
- **0% Error Rate** after idempotency tuning.

## 🚀 Deployment

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase Project
- Upstash Redis DB

### Environment Variables

Configure `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Build & Run

```bash
pnpm install
pnpm build
pnpm start
```

## 📈 Scaling Plan

- **Vertical**: Database compute scales automatically with Supabase.
- **Horizontal**: Next.js serverless functions scale infinitely on Vercel Edge Network.
- **Read Replicas**: Can be enabled in Supabase for high-read throughput.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Maintained by @Rexy-5097**
