
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log("Checking idempotency_keys table...");
    const { data, error } = await supabase.from('idempotency_keys').select('*').limit(1);
    
    if (error) {
        console.error("❌ Table check failed:", error);
    } else {
        console.log("✅ Table exists. Rows found:", data?.length);
    }
}

check();
