
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupGuest() {
  const email = 'guest_test@furnitureops.com';
  const password = 'password123';

  // 1. Check if exists
  const { data: existing } = await supabase.from('auth.users').select('id').eq('email', email).single();
  // Direct table access to auth.users is not usually allowed via client unless service role...
  // Actually, we can just try to create and ignore error, or use admin.listUsers

  // Cleaner: Just create or update
  // But admin.createUser fails if exists.
  // We'll delete if exists then create.
  
  // Actually, let's just use a random email to be safe and print it
  const uniqueEmail = `guest_${Date.now()}@test.com`;
  
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: uniqueEmail,
    password: password,
    email_confirm: true
  });

  if (error) {
    console.error('Failed to create guest:', error);
    process.exit(1);
  }

  console.log(`CREATED_GUEST_EMAIL=${uniqueEmail}`);
  console.log(`CREATED_GUEST_PASSWORD=${password}`);
}

setupGuest();
