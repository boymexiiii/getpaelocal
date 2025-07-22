import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials (set in .env or deployment environment)
const supabaseUrl = process.env.SUPABASE_URL || 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzMwMTksImV4cCI6MjA2NjUwOTAxOX0.RV42GZbBYIrf6Qyyn0Q7aRlmTu2e';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('🔍 Checking users in the database...');
    
    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth users (need admin privileges)');
    } else if (authUsers && authUsers.users.length > 0) {
      console.log(`👥 Found ${authUsers.users.length} auth users`);
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}, ID: ${user.id}, Created: ${user.created_at}`);
      });
    } else {
      console.log('❌ No auth users found');
    }

    // Check profiles
    console.log('\n👤 Checking user profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
    } else if (profiles && profiles.length > 0) {
      console.log(`👤 Found ${profiles.length} user profiles:`);
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. User ID: ${profile.id}, Email: ${profile.email}, Phone: ${profile.phone}, Role: ${profile.role}`);
      });
    } else {
      console.log('❌ No user profiles found');
    }

    // Check wallets
    console.log('\n💰 Checking wallets...');
    const { data: wallets, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });

    if (walletError) {
      console.error('❌ Error fetching wallets:', walletError);
    } else if (wallets && wallets.length > 0) {
      console.log(`💰 Found ${wallets.length} wallets:`);
      wallets.forEach((wallet, index) => {
        console.log(`${index + 1}. User: ${wallet.user_id}, Currency: ${wallet.currency}, Balance: ₦${wallet.balance}`);
      });
    } else {
      console.log('❌ No wallets found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkUsers(); 