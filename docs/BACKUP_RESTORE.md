# Backup & Disaster Recovery (DR) Plan

## 1. Database Backups (Supabase)

### Automated Backups

- **Frequency**: Daily (Midnight UTC).
- **Retention**: 7 Days (Point-In-Time Recovery enabled for Pro plan).
- **Storage**: Encrypted at rest in AWS S3 (managed by Supabase).

### Point-In-Time Recovery (PITR)

**RPO (Recovery Point Objective):** < 5 seconds.
**RTO (Recovery Time Objective):** < 20 minutes.

**Procedure:**

1. Go to Supabase Dashboard -> Database -> Backups.
2. Select time point.
3. Restore to a **new project** (Recommended) or overwrite existing (Emergency only).

## 2. Inventory State Recovery

In case of data corruption (logic bug):

1. **Audit Logs**: Use `audit_logs` table to replay transactions.
   - Each `INSERT` to `audit_logs` records the `action` and `details`.
   - Reconstruct inventory counts by summing `quantity` changes from a known checkpoint.

## 3. Disaster Recovery Drills

**Frequency**: Biannually.

**Drill Scenarios:**

1. **Region Failure**: verify app can be deployed to a different Vercel region.
2. **Database Corruption**: Restore a staging clone from production PITR backup.

## 4. Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Supabase Support**: Enterprise Priority Support (if applicable) or support@supabase.com.
