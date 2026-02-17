/**
 * Migration: Create idempotency_keys table
 * 
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/migrations/001_create_idempotency_keys.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  console.log('🔧 Running Migration: Create idempotency_keys table...');

  // Use Supabase's /rest/v1/rpc endpoint with a raw SQL function
  // First, try to create using the pg_net extension or direct fetch to the SQL endpoint
  const sqlStatements = [
    // 1. Create the table
    `CREATE TABLE IF NOT EXISTS public.idempotency_keys (
      key        TEXT PRIMARY KEY,
      request_hash TEXT NOT NULL,
      response_status INTEGER NOT NULL DEFAULT 202,
      response_body  JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    // 2. Index for TTL cleanup
    `CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON public.idempotency_keys(created_at)`,
    // 3. Enable RLS
    `ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY`,
    // 4. RLS Policy: Deny all non-service access
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deny_all_idempotency' AND tablename = 'idempotency_keys') THEN
        CREATE POLICY deny_all_idempotency ON public.idempotency_keys FOR ALL USING (false);
      END IF;
    END $$`,
    // 5. Grant service_role access
    `GRANT ALL ON public.idempotency_keys TO service_role`,
    // 6. Crash recovery RPC
    `CREATE OR REPLACE FUNCTION public.claim_stale_idempotency_key(p_key TEXT)
    RETURNS SETOF public.idempotency_keys AS $$
      UPDATE public.idempotency_keys
      SET response_status = 202, updated_at = now()
      WHERE key = p_key
        AND response_status = 202
        AND updated_at < now() - INTERVAL '30 seconds'
      RETURNING *;
    $$ LANGUAGE SQL VOLATILE SECURITY DEFINER`,
    // 7. Reload PostgREST schema cache
    `NOTIFY pgrst, 'reload schema'`
  ];

  // Execute via Supabase's SQL API (supabase-js v2 doesn't support raw SQL,
  // so we use the /pg endpoint if available, or fall back to individual statements)
  
  // Try the Supabase Management API SQL endpoint
  const pgRestUrl = `${supabaseUrl}/rest/v1/`;
  
  // Alternative: Use the Supabase DB directly via the service role key
  // The service role key provides full DB access through PostgREST
  // But we need raw SQL execution — use the /sql endpoint if available
  
  // For hosted Supabase, raw SQL requires the dashboard or the `supabase` CLI.
  // For local Docker Supabase, we can use the pg endpoint.
  // Let's try the standard approach: connect to Postgres directly.

  try {
    // Try using fetch to the Supabase SQL endpoint (available on local instances)
    const sqlEndpoint = supabaseUrl.replace(/\/+$/, '') + '/pg';
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`  [${i + 1}/${sqlStatements.length}] Executing...`);
      
      const res = await fetch(sqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!res.ok) {
        const text = await res.text();
        // If /pg endpoint not available, try alternative
        if (res.status === 404) {
          console.log('  ⚠️ /pg endpoint not available. Trying alternative...');
          throw new Error('PG_ENDPOINT_NOT_AVAILABLE');
        }
        console.error(`  ❌ SQL Error: ${text}`);
      } else {
        console.log(`  ✅ Statement ${i + 1} executed`);
      }
    }
  } catch (err: any) {
    if (err.message === 'PG_ENDPOINT_NOT_AVAILABLE') {
      // Fallback: Write SQL file for manual execution
      console.log('\n📋 Direct SQL execution not available.');
      console.log('   Please run the following SQL in Supabase Dashboard → SQL Editor:\n');
      console.log('--- BEGIN SQL ---');
      console.log(sqlStatements.join(';\n\n') + ';');
      console.log('--- END SQL ---');
      
      // Also try using supabase CLI if available
      console.log('\n   Or run: supabase db execute --db-url <your-db-url>');
    } else {
      console.error('Migration error:', err.message);
    }
  }

  // Verify
  console.log('\n🔍 Verifying table accessibility...');
  const sb = createClient(supabaseUrl, serviceKey);
  const { data, error } = await sb.from('idempotency_keys').select('key').limit(1);
  if (error) {
    console.log(`❌ Table NOT accessible: ${error.code} — ${error.message}`);
    console.log('   You may need to run the SQL manually and then NOTIFY pgrst to reload.');
  } else {
    console.log(`✅ Table accessible! Rows: ${data.length}`);
  }
}

runMigration();
