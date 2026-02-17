/**
 * Cleanup Script — Remove test data from inventory
 * 
 * Deletes all inventory items containing "Test Item" in their name.
 * These were created by test scripts (test-load.ts, test-concurrency.ts, etc.)
 * 
 * Usage: npx tsx scripts/cleanup-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log('🔍 Looking for test items...\n');

  // Find all test items
  const { data: testItems, error: fetchError } = await supabase
    .from('inventory')
    .select('id, name')
    .ilike('name', '%Test Item%');

  if (fetchError) {
    console.error('❌ Error fetching test items:', fetchError.message);
    process.exit(1);
  }

  if (!testItems || testItems.length === 0) {
    console.log('✅ No test items found. Database is clean!');
    return;
  }

  console.log(`Found ${testItems.length} test item(s):`);
  testItems.forEach((item) => {
    console.log(`  - ${item.name} (${item.id})`);
  });

  // Delete them
  const ids = testItems.map((item) => item.id);
  const { error: deleteError } = await supabase
    .from('inventory')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('\n❌ Error deleting test items:', deleteError.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully deleted ${testItems.length} test item(s).`);
}

cleanup();
