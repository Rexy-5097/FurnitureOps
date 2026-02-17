
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAuditLogs() {
  console.log('🔍 Verifying Audit Logs...');

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'KILL_SWITCH_ACTIVATED')
    .order('timestamp', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Failed to fetch audit logs:', error.message);
    process.exit(1);
  }

  if (!logs || logs.length === 0) {
    console.log('⚠️ No audit logs found.');
  } else {
    console.log(`✅ Found ${logs.length} recent audit logs:`);
    logs.forEach(log => {
      console.log(`[${log.timestamp}] Action: ${log.action}, Details:`, JSON.stringify(log.details));
    });
  }
}

verifyAuditLogs();
