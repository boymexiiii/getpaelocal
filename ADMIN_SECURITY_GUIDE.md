# PaePros Admin Security Guide

## 🔐 Secure Admin Authentication Methods

### Method 1: Admin Code Authentication (Recommended for Development)

**Access URL:** `/admin-login`

**Default Code:** `0000000` (for development only)

**Security Features:**
- 7-digit numeric code
- Stored in sessionStorage/localStorage
- Environment variable support for production

**Setup:**
1. For development: Use the default code `0000000`
2. For production: Set `VITE_ADMIN_CODE` environment variable
3. Access `/admin-login` and enter the code

### Method 2: Role-Based Authentication (Recommended for Production)

**Access URL:** `/admin` (requires admin role)

**Security Features:**
- Database-based role system
- Proper user authentication
- Audit logging
- Session management

**Setup:**
1. Create a regular user account first
2. Access `/admin-setup` with admin setup code
3. Promote user to admin role
4. Login with user credentials to access admin panel

## 🛡️ Security Best Practices

### Environment Variables

**Development (.env.local):**
```bash
VITE_ADMIN_CODE=0000000
```

**Production (.env.production):**
```bash
VITE_ADMIN_CODE=your_secure_7_digit_code
ADMIN_SETUP_CODE=your_secure_setup_code
```

### Admin Role Hierarchy

1. **superadmin** - Full system access
2. **admin** - General admin access
3. **support** - Support and user management
4. **compliance** - KYC and compliance tools

### Access Control

- Admin routes are protected by `ProtectedRoute` component
- Role-based access control for different admin features
- Session-based authentication with automatic logout
- Audit logging for all admin actions

## 🚀 Quick Start Guide

### For Development:

1. **Access Admin Panel:**
   ```
   Navigate to: http://localhost:5173/admin-login
   Enter code: 0000000
   ```

2. **Create Admin User (Optional):**
   ```
   Navigate to: http://localhost:5173/admin-setup
   Enter user email and admin setup code
   ```

### For Production:

1. **Set Environment Variables:**
   ```bash
   VITE_ADMIN_CODE=your_secure_code
   ADMIN_SETUP_CODE=your_setup_code
   ```

2. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy setup-admin
   ```

3. **Create Admin User:**
   - Create regular user account
   - Use `/admin-setup` to promote to admin
   - Login with user credentials

## 🔧 Troubleshooting

### Common Issues:

1. **"Access Denied" Error:**
   - Check if admin code is correct
   - Verify environment variables are set
   - Clear browser storage and try again

2. **Role-Based Access Not Working:**
   - Ensure user has admin role in database
   - Check `user_roles` table
   - Verify `profiles.role` field

3. **Edge Function Errors:**
   - Check Supabase service role key
   - Verify function deployment
   - Check function logs in Supabase dashboard

### Database Queries:

**Check Admin Users:**
```sql
SELECT u.email, ur.role 
FROM auth.users u 
JOIN user_roles ur ON u.id = ur.user_id 
WHERE ur.role IN ('admin', 'superadmin', 'support', 'compliance');
```

**Promote User to Admin:**
```sql
SELECT promote_user_to_admin('user@example.com');
```

## 📋 Security Checklist

- [ ] Change default admin code in production
- [ ] Set secure environment variables
- [ ] Deploy Edge Functions
- [ ] Create admin users with proper roles
- [ ] Enable audit logging
- [ ] Set up session timeout
- [ ] Configure CORS properly
- [ ] Enable RLS on all tables
- [ ] Test access control thoroughly

## 🚨 Emergency Access

If you lose admin access:

1. **Reset via Database:**
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('your-user-id', 'admin') 
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

2. **Use Admin Setup:**
   - Access `/admin-setup`
   - Use admin setup code
   - Promote existing user to admin

3. **Contact Support:**
   - If database access is lost
   - For production emergencies

## 📞 Support

For admin access issues:
- Check this guide first
- Review Supabase logs
- Contact system administrator
- Use emergency access procedures if needed 