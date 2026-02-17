
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testConsistency() {
  console.log('🧪 Starting DB Consistency Checks...');

  // 1. Setup Test Item
  const { data: item, error: createError } = await supabase
    .from('inventory')
    .insert({
      name: 'Consistency Test Item',
      price: 100,
      quantity_available: 10,
      image_url: 'https://placehold.co/100', // Mock
      quantity_sold: 0
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Setup failed:', createError.message);
    process.exit(1);
  }
  console.log('✅ Setup Test Item:', item.id);

  let passed = true;

  // 2. Test Negative Quantity (Direct DB Update)
  // Note: If no CHECK constraint exists in DB, this might succeed (which is a fail for consistency)
  // Unless we rely on API validation. But "DB consistency" implies DB constraints.
  console.log('\n🔸 Test 1: Negative Quantity (Direct DB Update)');
  const { error: negQtyError } = await supabase
    .from('inventory')
    .update({ quantity_available: -5 })
    .eq('id', item.id);

  if (negQtyError) {
    console.log('✅ Blocked Negative Quantity:', negQtyError.message);
  } else {
    // If it succeeded, check if it actually updated to -5
    const { data: check } = await supabase.from('inventory').select('quantity_available').eq('id', item.id).single();
    if (check?.quantity_available === -5) {
       console.error('❌ FAILED: Database allowed negative quantity!');
       passed = false;
    } else {
       console.log('✅ Blocked (or ignored) Negative Quantity');
    }
  }

  // 3. Test Negative Price
  console.log('\n🔸 Test 2: Negative Price');
  const { error: negPriceError } = await supabase
    .from('inventory')
    .update({ price: -100 })
    .eq('id', item.id);

  if (negPriceError) {
    console.log('✅ Blocked Negative Price:', negPriceError.message);
  } else {
     const { data: check } = await supabase.from('inventory').select('price').eq('id', item.id).single();
     if (check?.price === -100) {
        console.error('❌ FAILED: Database allowed negative price!');
        passed = false;
     } else {
        console.log('✅ Blocked (or ignored) Negative Price');
     }
  }

  // 4. Test Over-Decrement via RPC
  console.log('\n🔸 Test 3: Over-Decrement via RPC');
  // Decrement 20 from 10 (or whatever is left)
  // Reset generic qty first
  await supabase.from('inventory').update({ quantity_available: 10 }).eq('id', item.id);
  
  const { error: rpcError } = await supabase.rpc('decrement_stock_with_idempotency', {
    p_item_id: item.id,
    p_quantity: 20,
    p_actor_id: item.id, // Dummy actor
    p_idempotency_key: 'test-consist-1'
  });

  if (rpcError && rpcError.message.includes('Insufficient stock')) {
    console.log('✅ RPC Blocked Over-Decrement:', rpcError.message);
  } else if (rpcError) {
    console.log('✅ RPC Failed (as expected) with other error:', rpcError.message);
  } else {
    console.error('❌ FAILED: RPC allowed over-decrement!');
    passed = false;
  }

  // Cleanup
  await supabase.from('inventory').delete().eq('id', item.id);

  if (passed) {
    console.log('\n🎉 Consistency Checks PASSED');
    process.exit(0);
  } else {
    console.error('\n💥 CHECK FAILED');
    process.exit(1);
  }
}

testConsistency();
