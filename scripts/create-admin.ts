import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables (URL or Service Key)');
  process.exit(1);
}

// Service role client needed for Admin User creation
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const EMAIL = 'admin@furnitureops.com';
const PASSWORD = 'password123';

async function main() {
  console.log(`🔑 Provisioning Admin User: ${EMAIL}`);

  // 1. Create Supabase Auth User
  // We use admin.createUser to skip email verification if possible/configured
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true
  });

  let userId = user?.id;

  if (createError) {
      console.log(`   ℹ️ User creation note: ${createError.message}`);
      // If user already exists, try to fetch ID
      if (createError.message.includes("already registered") || createError.code === 'email_exists') {
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === EMAIL);
          if (existingUser) {
              userId = existingUser.id;
              console.log(`   ✅ Found existing user ID: ${userId}`);
          } else {
             console.error('❌ Could not find existing user ID.');
             process.exit(1);
          }
      } else {
          console.error('❌ Critical error creating user:', createError);
          process.exit(1);
      }
  } else {
      console.log(`   ✅ Created new Auth User: ${userId}`);
  }

  if (!userId) {
      console.error('❌ No User ID found. Aborting.');
      process.exit(1);
  }

  // 2. Insert into public.admins table
  console.log('🛡️  Adding to public.admins table...');
  
  const { error: insertError } = await supabase
    .from('admins')
    .insert({ id: userId })
    .select()
    .single();

  if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        console.log('   ✅ User is already in admins table.');
      } else {
        console.error('❌ Failed to add to admins table:', insertError.message);
        process.exit(1);
      }
  } else {
      console.log('   ✅ User promoted to Admin.');
  }

  console.log('\n🎉 Admin Ready');
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Pass:  ${PASSWORD}`);
}

main();
