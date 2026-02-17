
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugAuth() {
  console.log('🕵️‍♀️ Debugging Auth...');

  // 1. Sign In
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@furnitureops.com',
    password: 'password123'
  });

  if (authError || !authData.session) {
    console.error('❌ Login failed:', authError?.message);
    return;
  }
  console.log('✅ Login successful. User ID:', authData.session.user.id);
  const token = authData.session.access_token;

  // 2. Check Admin Table
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('id', authData.session.user.id)
    .single();

  if (adminError || !admin) {
      console.error('❌ User is NOT in admins table:', adminError?.message);
  } else {
      console.log('✅ User IS in admins table:', admin);
  }

  // 3. Validate Token via getUser (Simulating Auth Guard)
  // We need to use a client configured with the TOKEN, not service role, to simulate the request context?
  // Actually, auth-guard uses service client to validate the token string passed in header.
  
  const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
  if (verifyError) {
      console.error('❌ getUser(token) failed:', verifyError.message);
  } else {
      console.log('✅ getUser(token) succeeded for:', user?.email);
  }
}

debugAuth();
