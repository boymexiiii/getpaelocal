import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const KYCAdminPage = () => {
  const { user, role, loading, isAdminRole } = useAuth();
  const navigate = useNavigate();
  const [kycApps, setKycApps] = useState<any[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdminRole(role)) return <div>Access denied</div>;

  useEffect(() => {
    fetchKycApps();
  }, []);

  const fetchKycApps = async () => {
    setLoadingKyc(true);
    try {
      const { data, error } = await supabase.from('kyc_applications').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching KYC applications:', error);
      }
      setKycApps(data || []);
      console.log('Fetched KYC applications:', data);
    } catch (err) {
      console.error('Unexpected error fetching KYC applications:', err);
    }
    setLoadingKyc(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>KYC Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingKyc ? (
            <div>Loading KYC applications...</div>
          ) : kycApps.length === 0 ? (
            <div>No KYC applications found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Status</th>
                  <th>KYC Level</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycApps.map(app => (
                  <tr key={app.id} className="border-t">
                    <td>{app.user_id}</td>
                    <td>{app.status}</td>
                    <td>{app.kyc_level}</td>
                    <td>{app.submitted_at ? new Date(app.submitted_at).toLocaleString() : '-'}</td>
                    <td>
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="destructive">Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCAdminPage; 