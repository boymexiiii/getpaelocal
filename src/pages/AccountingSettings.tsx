import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useNavigate } from 'react-router-dom';

const AccountingSettings = () => {
  const navigate = useNavigate();
  const { wallets } = useWallet();
  const { transactions } = useTransactionHistory();
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    const csvContent = [
      'Date,Type,Amount,Currency,Status,Description',
      ...transactions.map(tx =>
        `"${new Date(tx.created_at).toLocaleString()}","${tx.transaction_type}","${tx.amount}","${tx.currency}","${tx.status}","${tx.description || ''}"`
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExporting(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-purple-600 hover:text-purple-700">&larr; Back</Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounting</h1>
        <p className="text-gray-600 mb-6">View your wallet balances and export your transaction history.</p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallet Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {wallets.length === 0 ? (
              <div className="text-gray-500">No wallets found.</div>
            ) : (
              <ul className="space-y-2">
                {wallets.map(w => (
                  <li key={w.id} className="flex justify-between border-b pb-2">
                    <span>{w.currency} Wallet</span>
                    <span className="font-semibold">₦{w.balance.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-gray-500">No transactions found.</div>
            ) : (
              <ul className="space-y-2">
                {transactions.slice(0, 10).map(tx => (
                  <li key={tx.id} className="flex justify-between border-b pb-2 text-sm">
                    <span>{new Date(tx.created_at).toLocaleDateString()} - {tx.transaction_type}</span>
                    <span>₦{tx.amount.toLocaleString()} {tx.currency}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={handleExport} className="mt-4" disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export All Transactions as CSV'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccountingSettings; 