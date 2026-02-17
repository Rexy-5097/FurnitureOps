
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ITEM_ID = '1828e423-1c0b-4e0b-956b-8840beafa603'; // From Producer Output (Final Run)

async function verify() {
    console.log(`🔍 Verifying Item: ${ITEM_ID}`);

    const { data: item, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', ITEM_ID)
        .single();
    
    if (error) {
        console.error('❌ Failed to fetch item:', error);
        process.exit(1);
    }
    
    console.log(`📦 Item State: Qty ${item.quantity_available}, Sold ${item.quantity_sold}`);
    
    if (item.quantity_available === 50 && item.quantity_sold === 50) {
        console.log('✅ Inventory Update Verified (100 -> 50)');
    } else {
        console.error('❌ Inventory Mismatch! Expected 50/50.');
        console.error(`   Got: Available ${item.quantity_available}, Sold ${item.quantity_sold}`);
    }

    // Check Audit Logs
    const { count, error: auditError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('details->>item_id', ITEM_ID)
        .eq('action', 'STOCK_DECREMENT_WORKER');
        
    if (auditError) {
         console.error('❌ Failed to count audit logs:', auditError);
    } else {
         console.log(`📜 Audit Logs Check: Found ${count} entries (Expected ~50)`);
         if (count === 50) console.log('✅ Audit Log Count Verified');
         else console.warn('⚠️  Audit Log count mismatch (might be eventual consistency or failures)');
    }
}

verify();
