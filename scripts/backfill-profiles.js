#!/usr/bin/env node

/**
 * Backfill Profiles Script for PaePros
 *
 * Usage:
 * node scripts/backfill-profiles.js
 *
 * This script fetches all users from Supabase Auth and ensures each has a corresponding row in the 'profiles' table.
 * If a user is missing a profile, it creates one with default values.
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

async function backfillProfiles() {
  try {
    console.log('🔍 Fetching all users from Supabase Auth...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    console.log(`✅ Found ${users.users.length} users.`);

    console.log('🔍 Fetching all profiles...');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    const profileIds = new Set((profiles || []).map(p => p.id));

    let createdCount = 0;
    for (const user of users.users) {
      if (!profileIds.has(user.id)) {
        // Insert missing profile
        const { error } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          first_name: '',
          last_name: '',
          is_verified: false,
          kyc_level: 1,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          console.error(`❌ Failed to create profile for ${user.email}:`, error.message);
        } else {
          console.log(`✅ Created profile for ${user.email}`);
          createdCount++;
        }
      }
    }
    console.log(`🎉 Backfill complete. ${createdCount} profiles created.`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

backfillProfiles(); 