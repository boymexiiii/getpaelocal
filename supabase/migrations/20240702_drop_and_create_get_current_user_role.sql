-- Drop and recreate get_current_user_role with correct return type
DROP FUNCTION IF EXISTS get_current_user_role();
CREATE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$; 