
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Force TLS bypass just in case
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testInsert() {
    console.log("Testing Single INSERT to idempotency_keys...");
    const key = `firewall-test-${Date.now()}`;
    
    // Simulate the exact payload structure from idempotency.ts failure
    const { data, error } = await supabase.from('idempotency_keys').insert({
        key,
        request_hash: 'test-hash-12345',
        response_status: 202,
        response_body: null
    }).select();
    
    if (error) {
        console.error("❌ INSERT Failed:", error);
        // Print full error if it looks like HTML (sometimes parsed into message)
        if (JSON.stringify(error).includes('DOCTYPE html')) {
            console.error("🔥 FIREWALL BLOCK DETECTED in Error Object");
        }
    } else {
        console.log("✅ INSERT Success:", data);
        // Cleanup
        await supabase.from('idempotency_keys').delete().eq('key', key);
    }
}

testInsert();
