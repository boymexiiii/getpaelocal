// Script to fix admin page authentication
// This script helps identify admin pages that need authentication fixes

const adminPagesToFix = [
  'src/pages/admin/Wallets.tsx',
  'src/pages/admin/Transactions.tsx', 
  'src/pages/admin/Staff.tsx',
  'src/pages/admin/KYC.tsx',
  'src/pages/admin/Analytics.tsx',
  'src/pages/admin/Support.tsx',
  'src/pages/admin/System.tsx',
  'src/pages/admin/Payouts.tsx',
  'src/pages/admin/Cards.tsx',
  'src/pages/admin/Bills.tsx',
  'src/pages/admin/GiftCards.tsx',
  'src/pages/admin/Config.tsx'
];

console.log('🔧 Admin pages that need authentication fixes:');
adminPagesToFix.forEach(page => {
  console.log(`- ${page}`);
});

console.log('\n💡 To fix each page, add this code:');
console.log(`
// Check for admin session authentication
const adminAuthenticated = typeof window !== 'undefined' && 
  sessionStorage.getItem('admin_authenticated') === 'true';

// Update the useEffect to check for both admin session and user role
useEffect(() => {
  if (!loading) {
    // Allow access if admin is authenticated via session OR user has admin role
    if (!adminAuthenticated && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }
}, [user, role, loading, navigate, adminAuthenticated, isAdminRole]);

// Update the access check
if (!adminAuthenticated && (!user || !isAdminRole(role))) {
  return <div>Access denied</div>;
}
`);

console.log('\n✅ The AdminRoute component should handle most of this automatically!'); 