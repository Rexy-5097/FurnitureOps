
import { getAdminToken, getTestSupabase } from './lib/test-auth';

async function testIdempotency() {
  console.log('🧪 Starting Idempotency Test...');

  const sb = getTestSupabase();

  // 1. Authenticate (cached — avoids Supabase rate limiting)
  const { token } = await getAdminToken();
  console.log('✅ Admin Authenticated (cached)');

  // 2. Setup Test Item
  const { data: item } = await sb
    .from('inventory')
    .insert({
      name: 'Idempotency Test Item',
      price: 100,
      quantity_available: 50,
      image_url: 'https://placehold.co/100',
      quantity_sold: 0
    })
    .select()
    .single();

  if (!item) {
     console.error('❌ Setup failed');
     process.exit(1);
  }
  console.log(`✅ Setup Test Item: ${item.id}`);

  const idempotencyKey = `idem-test-${Date.now()}`;

  // 3. Request A (Initial)
  console.log('🔄 Request A (Initial)...');
  const resA = await fetch(`http://localhost:3000/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ decrement: 1 })
  });
  const dataA = await resA.json();
  const statusA = resA.status;
  console.log(`   -> Status: ${statusA}, New Qty: ${dataA.quantity_available}`);

  // 4. Request B (Duplicate Replay) — wait for A to commit
  console.log('🔁 Request B (Duplicate Replay, after 2s delay)...');
  await new Promise(r => setTimeout(r, 2000));
  const resB = await fetch(`http://localhost:3000/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ decrement: 1 }) // EXACT SAME BODY
  });
  const dataB = await resB.json();
  const statusB = resB.status;
  console.log(`   -> Status: ${statusB}, Body:`, dataB);

  // 5. Request C (Conflict - Same Key, Diff Body)
  console.log('⚔️ Request C (Conflict - Diff Body)...');
  const resC = await fetch(`http://localhost:3000/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ decrement: 5 }) // DIFFERENT BODY
  });
  const statusC = resC.status;
  console.log(`   -> Status: ${statusC}`);

  // Checks
  let passed = true;
  if (statusA !== 200) {
      console.error('❌ A Failed'); passed = false;
  }
  // B should be 200 (cached) if commit completed, or 409 if still processing.
  if (statusB === 200) {
      console.log('✅ B returned cached response (200)');
      if (dataA.quantity_available !== dataB.quantity_available) {
          console.error('❌ B returned different data than A'); passed = false;
      }
  } else if (statusB === 409) {
      console.log('✅ B returned 409 (Processing/Conflict — idempotency lock active)');
  } else {
      console.error(`❌ B returned unexpected status: ${statusB}`); passed = false;
  }

  if (statusC !== 409) {
      console.error('❌ C Failed (Should be 409 Conflict)'); passed = false;
  }

  // Final DB Check - Should have decremented ONLY ONCE
  const { data: finalItem } = await sb.from('inventory').select('*').eq('id', item.id).single();
  if (finalItem.quantity_available !== 49) {
      console.error(`❌ DB State Wrong. Expected 49, got ${finalItem.quantity_available}`); passed = false;
  }

  // Cleanup
  await sb.from('inventory').delete().eq('id', item.id);
  await sb.from('idempotency_keys').delete().eq('key', idempotencyKey);

  if (passed) {
      console.log('✅ IDEMPOTENCY TEST PASSED');
      process.exit(0);
  } else {
      console.log('❌ IDEMPOTENCY TEST FAILED');
      process.exit(1);
  }
}

testIdempotency();
