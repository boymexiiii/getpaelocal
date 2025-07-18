import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const WalletsAdminPage = () => {
  const { user, role, loading, isAdminRole } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdminRole(role)) return <div>Access denied</div>;

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoadingWallets(true);
    try {
      const { data, error } = await supabase.from('wallets').select('*');
      if (error) {
        console.error('Error fetching wallets:', error);
      }
      setWallets(data || []);
      console.log('Fetched wallets:', data);
    } catch (err) {
      console.error('Unexpected error fetching wallets:', err);
    }
    setLoadingWallets(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Wallets Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWallets ? (
            <div>Loading wallets...</div>
          ) : wallets.length === 0 ? (
            <div>No wallets found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(wallet => (
                  <tr key={wallet.id} className="border-t">
                    <td>{wallet.user_id}</td>
                    <td>{wallet.currency}</td>
                    <td>&#8358;{wallet.balance.toLocaleString()}</td>
                    <td>{wallet.is_frozen ? 'Frozen' : 'Active'}</td>
                    <td>
                      <Button size="sm">Adjust</Button>
                      <Button size="sm" variant="outline">{wallet.is_frozen ? 'Unfreeze' : 'Freeze'}</Button>
                      <Button size="sm" variant="outline">Set Limit</Button>
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

export default WalletsAdminPage; 