// Script to find pending transactions
// Run this in your browser console on the admin page

const findPendingTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('📋 Pending Transactions:');
    console.log('========================');
    
    if (data && data.length > 0) {
      data.forEach((tx, index) => {
        console.log(`${index + 1}. Transaction ID: ${tx.id}`);
        console.log(`   User ID: ${tx.user_id}`);
        console.log(`   Amount: ₦${tx.amount}`);
        console.log(`   Type: ${tx.transaction_type}`);
        console.log(`   Description: ${tx.description}`);
        console.log(`   Created: ${new Date(tx.created_at).toLocaleString()}`);
        console.log(`   Reference: ${tx.reference}`);
        console.log('---');
      });
      
      console.log('💡 To complete a transaction, use:');
      console.log('completePendingTransaction("transaction-id", "user-id")');
    } else {
      console.log('✅ No pending transactions found!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Auto-run when script is loaded
findPendingTransactions();

console.log('🔍 Use findPendingTransactions() to refresh the list'); 