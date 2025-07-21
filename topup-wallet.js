import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNodGt5a3hrY2piZ3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY5NzI5NywiZXhwIjoyMDUxMjczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function topupWallet() {
  try {
    const userEmail = 'kingsleyanamelechi422@gmail.com';
    const amount = 150;

    console.log(`🔍 Looking for user: ${userEmail}`);
    
    // First, find the user by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message || 'User does not exist');
      return;
    }

    console.log(`✅ Found user: ${user.full_name} (${user.id})`);

    // Check if user has a wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', 'NGN')
      .single();

    if (walletError || !wallet) {
      console.log('💰 Creating new wallet for user...');
      
      // Create a new wallet
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          currency: 'NGN',
          balance: amount,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create wallet:', createError.message);
        return;
      }

      console.log(`✅ Created new wallet with balance: ₦${amount}`);
    } else {
      console.log(`💰 Current wallet balance: ₦${wallet.balance}`);
      
      // Update existing wallet
      const newBalance = wallet.balance + amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) {
        console.error('❌ Failed to update wallet:', updateError.message);
        return;
      }

      console.log(`✅ Updated wallet balance: ₦${wallet.balance} → ₦${newBalance}`);
    }

    // Create a transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'deposit',
        amount: amount,
        currency: 'NGN',
        description: 'Wallet top-up',
        status: 'completed',
        reference: `TOPUP-${Date.now()}`,
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('❌ Failed to create transaction record:', transactionError.message);
      return;
    }

    console.log(`✅ Transaction record created successfully`);
    console.log(`🎉 Successfully topped up ${user.full_name}'s wallet with ₦${amount}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the topup
topupWallet(); 