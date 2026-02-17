import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create a client with the ANON key (simulating a public/unauthenticated user)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔒 Starting RLS Verification...');
  console.log('   User: Public / Anonymous');

  let hasError = false;

  // TEST 1: Read Admins (Should FAIL)
  console.log('\n1️⃣ Testing Read Access on "admins" table...');
  const { data: admins, error: adminError } = await supabase.from('admins').select('*');

  if (adminError) {
      // Depending on policy, it might return an empty array OR an error.
      // Usually RLS returns empty array for "select" if no policy matches, 
      // ensuring the existence of the table isn't leaked significantly, 
      // OR if the policy is "using (false)".
      // Our policy is "using (auth.uid() = id)", which means for anon it evaluates to false.
      // So we expect an empty array, NOT an error, but definitely NOT data.
      console.log('   ℹ️ Supabase returned error (unexpected but secure):', adminError.message);
  } else if (admins && admins.length > 0) {
      console.error('🔴 CRITICAL SECURITY FAIL: Public can read Admins!');
      console.error('   Data leaked:', admins);
      hasError = true;
  } else {
      console.log('✅ Security Pass: Admins table returns no data to public.');
  }

  // TEST 2: Read Inventory (Should SUCCEED)
  console.log('\n2️⃣ Testing Read Access on "inventory" table...');
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('*')
    .limit(1);

  if (inventoryError) {
      console.error('🔴 FAIL: Public cannot read inventory!');
      console.error('   Error:', inventoryError.message);
      hasError = true;
  } else {
      console.log(`✅ Security Pass: Public read on inventory works. (${inventory.length} items found)`);
  }

  // TEST 3: Write Inventory (Should FAIL)
  console.log('\n3️⃣ Testing Write Access on "inventory" table...');
  const { error: writeError } = await supabase
    .from('inventory')
    .insert({
        name: 'Hacker Item',
        price: 0,
        image_url: 'http://evil.com', 
        quantity_available: 100
    });

  if (!writeError) {
      console.error('🔴 CRITICAL SECURITY FAIL: Public can write to inventory!');
      hasError = true;
  } else {
      console.log('✅ Security Pass: Public write to inventory blocked.');
      // Expecting "new row violates row-level security policy"
  }

  console.log('\n---------------------------------------------------');
  if (hasError) {
      console.error('❌ RLS Verification FAILED. Security Issues Detected.');
      process.exit(1);
  } else {
      console.log('🎉 RLS Verification PASSED. System is secure.');
      process.exit(0);
  }
}

main().catch(err => {
    console.error('Unexpected script error:', err);
    process.exit(1);
});
