-- RBAC Migration: Roles, Permissions, Role-Permissions

-- 1. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 2. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 3. Role-Permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Update user_roles to reference roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

-- 5. Migrate existing roles to new roles table
INSERT INTO roles (name)
SELECT DISTINCT role FROM user_roles
ON CONFLICT (name) DO NOTHING;

-- 6. Update user_roles.role_id based on new roles table
UPDATE user_roles SET role_id = roles.id FROM roles WHERE user_roles.role = roles.name;

-- 7. (Optional) Add initial permissions
INSERT INTO permissions (name, description) VALUES
  ('view_users', 'View user list and details'),
  ('edit_users', 'Edit user details'),
  ('view_audit_logs', 'View audit logs'),
  ('manage_billing', 'Manage billing and invoices'),
  ('manage_kyc', 'Manage KYC applications'),
  ('manage_alerts', 'Manage system alerts'),
  ('manage_settings', 'Manage platform settings'),
  ('manage_integrations', 'Manage integrations')
ON CONFLICT (name) DO NOTHING; 