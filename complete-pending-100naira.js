// Simple script to complete pending 100 naira transaction
// Run this in your browser console on the admin page

const completePendingTransaction = async (transactionId, userId) => {
  try {
    const { data, error } = await supabase.functions.invoke('complete-pending-transaction', {
      body: {
        transactionId,
        userId,
        adminUserId: user.id
      }
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data.success) {
      console.log('✅ Transaction completed successfully!');
      console.log('Amount credited:', data.data.amount);
      console.log('Previous balance:', data.data.previous_balance);
      console.log('New balance:', data.data.new_balance);
    } else {
      console.error('Failed:', data.error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// To use this script:
// 1. Go to your admin dashboard
// 2. Open browser console (F12)
// 3. Copy and paste this script
// 4. Find the pending transaction ID and user ID from the pending transactions tab
// 5. Run: completePendingTransaction('transaction-id-here', 'user-id-here')

console.log('✅ Script loaded! Use completePendingTransaction(transactionId, userId) to complete a pending transaction'); 