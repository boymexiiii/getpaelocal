import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the frontend
const supabaseUrl = 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzMwMTksImV4cCI6MjA2NjUwOTAxOX0.RV42GZbBYIrf6Qyyn0Q7aRlmTu2exgQtDaQtO46RV_4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  try {
    console.log('🔍 Checking for data in database tables...');
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`);
    } else {
      console.log(`📊 Profiles: ${profiles ? 'Has data' : 'No data'}`);
    }
    
    // Check wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('count')
      .limit(1);
    
    if (walletsError) {
      console.log(`❌ Wallets error: ${walletsError.message}`);
    } else {
      console.log(`💰 Wallets: ${wallets ? 'Has data' : 'No data'}`);
    }
    
    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (transactionsError) {
      console.log(`❌ Transactions error: ${transactionsError.message}`);
    } else {
      console.log(`📋 Transactions: ${transactions ? 'Has data' : 'No data'}`);
    }
    
    // Check auth users (this might not work with anon key)
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.log(`❌ Auth users check failed: ${authError.message}`);
      } else {
        console.log(`👥 Auth users: ${authUsers?.users?.length || 0} users found`);
      }
    } catch (err) {
      console.log(`❌ Cannot check auth users: ${err.message}`);
    }
    
    console.log('\n💡 Summary:');
    console.log('- If all tables show "No data", the database was reset');
    console.log('- If auth users shows 0, all user accounts were deleted');
    console.log('- You will need to recreate all user accounts and data');
    
  } catch (error) {
    console.error('❌ Data check failed:', error);
  }
}

// Run the check
checkData(); 