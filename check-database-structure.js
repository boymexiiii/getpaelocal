import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the frontend
const supabaseUrl = 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzMwMTksImV4cCI6MjA2NjUwOTAxOX0.RV42GZbBYIrf6Qyyn0Q7aRlmTu2exgQtDaQtO46RV_4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if key tables exist
    const keyTables = [
      'profiles',
      'wallets', 
      'transactions',
      'investments',
      'notifications',
      'otps'
    ];
    
    console.log('\n📋 Checking key tables:');
    for (const tableName of keyTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    // Check transactions table structure specifically
    console.log('\n🔍 Checking transactions table structure...');
    try {
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
      
      if (txError) {
        console.log(`❌ Transactions table error: ${txError.message}`);
      } else {
        console.log('✅ Transactions table exists');
        
        // Try to insert a test record to check for missing columns
        const testRecord = {
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          transaction_type: 'test',
          amount: 0,
          description: 'Test record',
          reference: 'TEST_' + Date.now(),
          flw_reference: 'FLW_TEST_' + Date.now(),
          flw_response: { test: true }
        };
        
        try {
          const { error: insertError } = await supabase
            .from('transactions')
            .insert(testRecord);
          
          if (insertError) {
            console.log(`❌ Insert test failed: ${insertError.message}`);
            
            // Check if it's a column issue
            if (insertError.message.includes('flw_reference')) {
              console.log('💡 Missing flw_reference column - run add-flutterwave-columns.sql');
            }
            if (insertError.message.includes('flw_response')) {
              console.log('💡 Missing flw_response column - run add-flutterwave-columns.sql');
            }
          } else {
            console.log('✅ Transactions table structure is correct');
            
            // Clean up test record
            await supabase
              .from('transactions')
              .delete()
              .eq('reference', testRecord.reference);
          }
        } catch (insertErr) {
          console.log(`❌ Insert test error: ${insertErr.message}`);
        }
      }
    } catch (err) {
      console.log(`❌ Transactions check error: ${err.message}`);
    }
    
    // Check for any existing data
    console.log('\n📊 Checking for existing data...');
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (profilesError) {
        console.log(`❌ Profiles check: ${profilesError.message}`);
      } else {
        console.log('✅ Profiles table accessible');
      }
    } catch (err) {
      console.log(`❌ Profiles check error: ${err.message}`);
    }
    
    console.log('\n💡 Next steps:');
    console.log('1. If tables are missing, run the restore-database.sql in Supabase dashboard');
    console.log('2. If flw_reference/flw_response columns are missing, run add-flutterwave-columns.sql');
    console.log('3. Test the application at http://localhost:8081');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkDatabaseStructure(); 