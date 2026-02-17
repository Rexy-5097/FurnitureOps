
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ITEM_ID = '6f28a1cf-8954-404e-9c31-d5bef3810bf6'; // From Concurrency Test Output

async function verify() {
    console.log(`🔍 Verifying Item Simple: ${ITEM_ID}`);

    const { data: item, error } = await supabase
        .from('inventory')
        .select('quantity_available, quantity_sold')
        .eq('id', ITEM_ID)
        .single();
    
    if (error) {
        console.error('❌ Failed:', error);
    } else {
        console.log(`📦 Item: Available ${item.quantity_available}, Sold ${item.quantity_sold}`);
    }
}

verify();
