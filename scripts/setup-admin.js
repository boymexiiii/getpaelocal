#!/usr/bin/env node

/**
 * Admin Setup Script for PaePros
 * 
 * Usage:
 * node scripts/setup-admin.js <email> <admin-code>
 * 
 * Example:
 * node scripts/setup-admin.js admin@paepros.com 0000000
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = "https://rxnhnvshktykxhcjbgzm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmin(email, adminCode) {
  try {
    console.log(`🔧 Setting up admin user: ${email}`);
    
    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log('💡 Please create a user account first');
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    
    // Promote user to admin role
    const { error: roleError } = await supabase.rpc('promote_user_to_admin', {
      user_email: email
    });
    
    if (roleError) {
      console.error('❌ Error promoting user to admin:', roleError);
      return;
    }
    
    console.log(`✅ Successfully promoted ${email} to admin role`);
    console.log(`🔗 Admin can now login at: /admin-login`);
    console.log(`🔗 Or access admin panel directly at: /admin`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Main execution
const [,, email, adminCode] = process.argv;

if (!email || !adminCode) {
  console.log('📖 Usage: node scripts/setup-admin.js <email> <admin-code>');
  console.log('📖 Example: node scripts/setup-admin.js admin@paepros.com 0000000');
  process.exit(1);
}

if (adminCode.length !== 7) {
  console.error('❌ Admin code must be exactly 7 digits');
  process.exit(1);
}

setupAdmin(email, adminCode); 