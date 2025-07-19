# 🚀 PaePros Admin Quick Start

## Immediate Access (Development)

### Option 1: Admin Code Login (Easiest)
1. **Navigate to:** `http://localhost:5173/admin-login`
2. **Enter code:** `0000000`
3. **Click:** "Login as Admin"
4. **Access:** Admin dashboard at `/admin`

### Option 2: Create Admin User (More Secure)
1. **Create regular account:** Sign up at `/register`
2. **Navigate to:** `http://localhost:5173/admin-setup`
3. **Enter:** Your email and admin setup code (`0000000`)
4. **Login:** Use your regular credentials at `/admin`

## 🔐 Credentials Summary

| Method | URL | Credentials |
|--------|-----|-------------|
| Admin Code | `/admin-login` | Code: `0000000` |
| Admin Setup | `/admin-setup` | Email + Code: `0000000` |
| Role-Based | `/admin` | User email + password (after setup) |

## 🛡️ Security Notes

- **Development:** Uses default code `0000000`
- **Production:** Set `VITE_ADMIN_CODE` environment variable
- **Session:** Admin access persists until browser close
- **Logout:** Clear browser storage or use logout button

## 🔧 Troubleshooting

### "Access Denied" Error
- Clear browser storage (localStorage/sessionStorage)
- Check if admin code is correct
- Try accessing `/admin-login` directly

### Role-Based Access Issues
- Ensure user exists in database
- Check if user has admin role
- Use admin setup page to promote user

### Edge Function Errors
- Check Supabase service role key
- Verify function deployment
- Check Supabase dashboard logs

## 📞 Need Help?

1. Check the full `ADMIN_SECURITY_GUIDE.md`
2. Review browser console for errors
3. Check Supabase dashboard logs
4. Use emergency access procedures if needed 