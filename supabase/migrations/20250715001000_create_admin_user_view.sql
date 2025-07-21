-- Create a view for admin user management with email and profile fields
CREATE OR REPLACE VIEW public.admin_user_view AS
SELECT
  p.id,
  p.full_name,
  p.is_verified,
  p.created_at AS profile_created_at,
  p.role,
  u.email,
  u.created_at AS user_created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id; 