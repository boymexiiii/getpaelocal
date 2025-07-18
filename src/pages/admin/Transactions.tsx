import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const TransactionsAdminPage = () => {
  const { user, role, loading, isAdminRole } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdminRole(role)) return <div>Access denied</div>;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching transactions:', error);
      }
      setTransactions(data || []);
      console.log('Fetched transactions:', data);
    } catch (err) {
      console.error('Unexpected error fetching transactions:', err);
    }
    setLoadingTx(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Transactions Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-t">
                    <td>{tx.id}</td>
                    <td>{tx.user_id}</td>
                    <td>&#8358;{tx.amount.toLocaleString()}</td>
                    <td>{tx.transaction_type}</td>
                    <td>{tx.status}</td>
                    <td>
                      <Button size="sm">Retry</Button>
                      <Button size="sm" variant="outline">Audit Trail</Button>
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

export default TransactionsAdminPage; 