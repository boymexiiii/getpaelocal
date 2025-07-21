import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const API_BASE = '/functions/admin-system-tools/rbac';

const RolePermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{ [roleId: number]: number[] }>({});
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles, permissions, and role-permissions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
          fetch(`${API_BASE}/roles`).then(r => r.json()),
          fetch(`${API_BASE}/permissions`).then(r => r.json()),
          fetch(`${API_BASE}/role-permissions`).then(r => r.json()),
        ]);
        if (rolesRes.error || permsRes.error || rolePermsRes.error) {
          setError(rolesRes.error?.message || permsRes.error?.message || rolePermsRes.error?.message || 'Error loading data');
        } else {
          setRoles(rolesRes.data);
          setPermissions(permsRes.data);
          // Build rolePermissions map: { roleId: [permissionId, ...] }
          const rp: { [roleId: number]: number[] } = {};
          rolePermsRes.data.forEach((rpRow: any) => {
            if (!rp[rpRow.role_id]) rp[rpRow.role_id] = [];
            rp[rpRow.role_id].push(rpRow.permission_id);
          });
          setRolePermissions(rp);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTogglePermission = async (roleId: number, permissionId: number) => {
    setSaving(true);
    setError(null);
    const hasPerm = rolePermissions[roleId]?.includes(permissionId);
    try {
      const res = await fetch(`${API_BASE}/role-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: roleId,
          permission_id: permissionId,
          action: hasPerm ? 'remove' : 'add',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Failed to update permission');
      setRolePermissions(prev => {
        const perms = prev[roleId] || [];
        if (hasPerm) {
          return { ...prev, [roleId]: perms.filter(p => p !== permissionId) };
        } else {
          return { ...prev, [roleId]: [...perms, permissionId] };
        }
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Failed to add role');
      setRoles([...roles, data.data[0]]);
      setNewRole('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="p-6 text-red-500">{error}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Role & Permission Management</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Role</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Role name"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="border rounded px-3 py-2 w-64"
            />
            <Button onClick={handleAddRole} disabled={!newRole || saving}>Add Role</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    {roles.map(role => (
                      <TableHead key={role.id}>{role.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission: any) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.name}</TableCell>
                      {roles.map(role => (
                        <TableCell key={role.id} className="text-center">
                          <input
                            type="checkbox"
                            checked={rolePermissions[role.id]?.includes(permission.id) || false}
                            onChange={() => handleTogglePermission(role.id, permission.id)}
                            disabled={saving}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RolePermissionManagement; 