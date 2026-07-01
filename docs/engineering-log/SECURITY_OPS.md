# Security Operations Manual

## 1. Secret Rotation Policy

### Service Account Keys (Supabase)

**Rotation Frequency:** 90 Days or upon compromise.

**Procedure:**

1. **Generate New Keys**: Go to Supabase Dashboard -> Project Settings -> API.
2. **Update Environment**:
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel/Hosting provider.
   - Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
3. **Redeploy**: Trigger a deployment to propagate new env vars.
4. **Revoke Old Keys**: (Note: Supabase key rotation replaces keys. Verify old keys are invalid).

### JWT Secret

**Procedure:**

1. Generate a new JWT Secret in Supabase -> Authentication -> Configuration.
2. Update `SUPABASE_JWT_SECRET` in Vercel.
3. **Impact**: All current user sessions will be invalidated. Users must re-login.

## 2. Environment Variable Management

- **Production**: Managed via Vercel Project Settings. NO `.env` files in production artifacts.
- **Local Development**: `.env.local` (Gitignored).
- **CI/CD**: Secrets injected via GitHub Actions Secrets.

## 3. Vulnerability Scanning

- **Dependabot**: Enabled on GitHub repository. Service Level Objective (SLO): Patch Critical/High within 24h.
- **Static Analysis**: `pnpm lint` runs on every PR.
- **SaaS Scan**: Periodic checks for sensitive logging and exposed secrets (Phase 3 Certification).

## 4. Access Control

- **Database**: Direct access restricted to VPC/IP Allowlist (if configured). App uses Supabase Client.
- **Admin Dashboard**: Protected by `admin` role in `users` table + RLS policies.
