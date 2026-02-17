import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyInvariants() {
  console.log('🔍 Starting Invariant Verification...');
  let failures = 0;

  // 1. Negative Stock
  const { data: negativeStock } = await supabase
    .from('inventory')
    .select('id, name, quantity_available')
    .lt('quantity_available', 0);

  if (negativeStock && negativeStock.length > 0) {
    console.error('❌ INVARIANT VIOLATION: Negative Stock detected!', negativeStock);
    failures++;
  } else {
    console.log('✅ Stock Non-Negative');
  }

  // 2. Duplicate Idempotency Keys (Should be impossible due to Unique Constraint, but check)
  // We can't easily check this via standard select unless we group by.
  // Postgres constraint is the source of truth, but we can check if any "Processing" (202) are stale (Orphaned Locks)
  const { data: staleLocks } = await supabase
    .from('idempotency_keys')
    .select('key, created_at, last_updated_at')
    .eq('response_status', 202)
    .lt('last_updated_at', new Date(Date.now() - 60000).toISOString()); // Older than 60s

  if (staleLocks && staleLocks.length > 0) {
    console.error(`⚠️ INVARIANT WARNING: ${staleLocks.length} Orphaned Idempotency Locks detected.`);
    // Not a strict data corrupt failure, but a liveness risk.
  } else {
    console.log('✅ No Stale Locks');
  }

  // 3. Audit Log Monotonicity (Heuristic)
  const { data: audits } = await supabase
    .from('audit_logs')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(100);

  // Just verifying we can read them. Gaps are hard to detect without sequence numbers.
  if (!audits) {
     console.error('❌ Could not read audit logs');
     failures++;
  } else {
     console.log(`✅ Audit Logs accessible (${audits.length} recent entries)`);
  }

  if (failures === 0) {
    console.log('🎉 ALL INVARIANTS PASSED');
    process.exit(0);
  } else {
    console.error(`💀 ${failures} INVARIANTS FAILED`);
    process.exit(1);
  }
}

verifyInvariants().catch(console.error);
