import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SupportAdminPage = () => {
  const { user, role, loading, isAdminRole } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdminRole(role)) return <div>Access denied</div>;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Support & Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Support tools coming soon...</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportAdminPage; 