-- Admin User Setup Script for PaePros
-- Run this in your Supabase SQL Editor

-- First, let's check if we have any existing users
SELECT 
  u.email,
  u.created_at,
  ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- If you want to promote an existing user to admin, use this:
-- Replace 'your-email@example.com' with the actual email
-- SELECT promote_user_to_admin('your-email@example.com');

-- To create a new admin user from scratch:
-- 1. First create a user account through the app
-- 2. Then run the promote function above 