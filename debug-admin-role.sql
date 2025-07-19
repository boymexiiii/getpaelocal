-- Debug Admin Role Queries
-- Run these in Supabase SQL Editor to check your admin user status

-- 1. Check all users and their roles
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Check specific user by email (replace with your admin email)
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'your-admin-email@example.com';

-- 3. Check if any users have admin roles
SELECT 
    id,
    email,
    role,
    created_at
FROM profiles 
WHERE role IN ('admin', 'superadmin', 'support', 'compliance')
ORDER BY created_at DESC;

-- 4. Update a specific user to admin role (replace with your email)
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';

-- 5. Verify the update worked
SELECT 
    id,
    email,
    role,
    updated_at
FROM profiles 
WHERE email = 'your-admin-email@example.com';

-- 6. Check auth.users table (if you have access)
-- Note: This might not be accessible from the client
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC; 