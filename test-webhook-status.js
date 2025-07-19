// Test webhook status and pending transactions
// Run this in browser console on your admin page

console.log('🔍 Checking webhook and transaction status...');

// Check current pending transactions
async function checkPendingTransactions() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching pending transactions:', error);
      return;
    }
    
    console.log('📋 Pending Transactions:', data);
    
    if (data && data.length > 0) {
      console.log('\n💰 Pending Transaction Details:');
      data.forEach(tx => {
        console.log(`- ID: ${tx.id}`);
        console.log(`- Amount: ₦${tx.amount}`);
        console.log(`- Reference: ${tx.reference}`);
        console.log(`- Status: ${tx.status}`);
        console.log(`- Created: ${new Date(tx.created_at).toLocaleString()}`);
        console.log('---');
      });
    } else {
      console.log('✅ No pending transactions found!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Test webhook URL
function testWebhookURL() {
  const webhookURL = 'https://rxnhnvshktykxhcjbgzm.supabase.co/functions/v1/flutterwave-verify';
  console.log('🔗 Webhook URL:', webhookURL);
  console.log('✅ This URL should be configured in your Flutterwave dashboard');
  console.log('📝 Webhook will automatically verify payments and credit wallets');
}

// Check wallet balance
async function checkWalletBalance() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }
    
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching wallet:', error);
      return;
    }
    
    console.log('💰 Current Wallet Balance: ₦' + (data?.balance || 0));
  } catch (err) {
    console.error('❌ Error checking wallet:', err);
  }
}

// Run all checks
console.log('\n🚀 Running diagnostics...\n');
checkPendingTransactions();
testWebhookURL();
checkWalletBalance();

console.log('\n📋 Next Steps:');
console.log('1. If you have pending transactions, complete them via admin panel');
console.log('2. Test a new payment to verify webhook works');
console.log('3. Check that wallet balance updates automatically'); 