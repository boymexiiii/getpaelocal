import { createClient } from '@supabase/supabase-js';

// Use the service role key for admin operations
const supabaseUrl = 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5NzI5NywiZXhwIjoyMDUzMDczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError && testError.message.includes('relation "profiles" does not exist')) {
      console.log('📋 Tables need to be created. Let me create them...');
      
      // Since we can't create tables directly via the client, let's check what exists
      console.log('🔍 Checking existing tables...');
      
      // Try to create a simple test record to see what tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.error('❌ Cannot access information_schema:', tablesError);
        console.log('💡 You may need to run the SQL manually in the Supabase dashboard');
        return;
      }
      
      console.log('📋 Existing tables:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      } else {
        console.log('  No tables found');
      }
      
      console.log('\n💡 To restore your database:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of restore-database.sql');
      console.log('4. Execute the SQL');
      
    } else if (testError) {
      console.error('❌ Database connection error:', testError);
    } else {
      console.log('✅ Database connection successful');
      console.log('✅ Tables already exist');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupDatabase(); 