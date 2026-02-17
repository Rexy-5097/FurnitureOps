
import { createTempAdmin, getTestSupabase } from './lib/test-auth';

async function testConcurrency() {
  console.log('🧪 Starting Concurrency Test...');

  const sb = getTestSupabase();

  // 1. Setup: Create isolated temp admin (uses admin.createUser — no rate limit)
  const { token, userId, cleanup } = await createTempAdmin();
  console.log(`✅ Temp Admin Created & Authenticated: ${userId}`);

  // 2. Setup Test Item (Qty: 10)
  const { data: item, error: itemCreateError } = await sb
    .from('inventory')
    .insert({
      name: 'Concurrency Test Item',
      price: 100,
      quantity_available: 10,
      image_url: 'https://placehold.co/100',
      quantity_sold: 0
    })
    .select()
    .single();

  if (itemCreateError) {
    console.error('❌ Setup failed:', itemCreateError.message);
    await cleanup();
    process.exit(1);
  }
  console.log(`✅ Setup Test Item: ${item.id} (Qty: 10)`);

  // 3. Fire 5 Concurrent Decrements
  console.log('🔥 Firing 5 concurrent atomic decrement requests...');
  
  const promises = Array.from({ length: 5 }).map(async (_, i) => {
    let idempotencyKey = `conc-test-${item.id}-${i}-${Date.now()}`;
    
    let retries = 5;
    while (retries > 0) {
        try {
          const res = await fetch(`http://localhost:3000/api/inventory/${item.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({ decrement: 1 })
          });
          
          // Retry on 401 (auth), 503 (service unavailable), or 409 (idempotency processing)
          if (res.status === 401 || res.status === 503 || res.status === 409) {
             console.warn(`⚠️ ${res.status} for req ${i}. Retrying with new idempotency key...`);
             idempotencyKey = `conc-test-${item.id}-${i}-${Date.now()}-r${6 - retries}`;
             retries--;
             const backoff = (6 - retries) * 500; // 500, 1000, 1500, 2000, 2500ms
             await new Promise(r => setTimeout(r, backoff));
             continue;
          }

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Status ${res.status}: ${text}`);
          }
          return { status: 'fulfilled', value: await res.json() };
        } catch (e: any) {
          if (retries <= 1) return { status: 'rejected', reason: e.message };
          retries--;
          const backoff = (6 - retries) * 300;
          await new Promise(r => setTimeout(r, backoff));
        }
    }
    return { status: 'rejected', reason: 'Retries exhausted' };
  });

  const results = await Promise.all(promises);
  
  // Log results
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failCount = results.filter(r => r.status === 'rejected').length;
  console.log(`📊 Results: ${successCount} Success, ${failCount} Failed`);
  
  if (failCount > 0) {
      console.error('⚠️ Some requests failed:', results.filter(r => r.status === 'rejected'));
  }

  // 4. Verify Final State
  const { data: finalItem } = await sb
    .from('inventory')
    .select('quantity_available, quantity_sold')
    .eq('id', item.id)
    .single();

  console.log(`🏁 Final State: Qty ${finalItem?.quantity_available}, Sold ${finalItem?.quantity_sold}`);

  let passed = true;
  if (finalItem?.quantity_available !== 5) {
     console.error('❌ FAILED: Expected Quantity 5, got', finalItem?.quantity_available);
     passed = false;
  } else {
     console.log('✅ PASSED: Quantity Correctly Decremented to 5');
  }

  if (finalItem?.quantity_sold !== 5) {
      console.error('❌ FAILED: Expected Sold 5, got', finalItem?.quantity_sold);
      passed = false;
  }

  // Cleanup
  await sb.from('inventory').delete().eq('id', item.id);
  await cleanup();
  
  if (passed) process.exit(0);
  else process.exit(1);
}

testConcurrency();
