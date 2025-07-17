
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Eye, AlertCircle, Download } from 'lucide-react';
import { Transaction } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';

interface AdminTransactionsTabProps {
  transactions: Transaction[];
}

const AdminTransactionsTab: React.FC<AdminTransactionsTabProps> = ({ transactions }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-blue-100 text-blue-800';
      case 'withdrawal': return 'bg-purple-100 text-purple-800';
      case 'transfer': return 'bg-indigo-100 text-indigo-800';
      case 'bank_transfer': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const exportTransactions = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Amount,Type,Status,User ID,Created At\n"
      + filteredTransactions.map(tx => 
          `"${tx.id}","${tx.amount}","${tx.transaction_type}","${tx.status}","${tx.user_id}","${new Date(tx.created_at).toLocaleString()}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Transaction data has been exported to CSV",
    });
  };

  const getFraudRiskLevel = (transaction: Transaction) => {
    // Simple fraud detection logic
    if (transaction.amount > 1000000 && transaction.transaction_type === 'withdrawal') {
      return 'high';
    }
    if (transaction.amount > 500000) {
      return 'medium';
    }
    return 'low';
  };

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completedTransactions = filteredTransactions.filter(tx => tx.status === 'completed');
  const failedTransactions = filteredTransactions.filter(tx => tx.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Volume</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{completedTransactions.length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{failedTransactions.length}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Transaction Monitoring
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search by ID or User..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportTransactions}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => {
              const riskLevel = getFraudRiskLevel(transaction);
              return (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">₦{transaction.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">ID: {transaction.id.slice(0, 8)}...</div>
                      </div>
                      <div>
                        <Badge className={getTypeColor(transaction.transaction_type)}>
                          {transaction.transaction_type}
                        </Badge>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(transaction.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">User: {transaction.user_id.slice(0, 8)}...</div>
                        {riskLevel === 'high' && (
                          <div className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            High Risk
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Transaction Details</DialogTitle>
                        </DialogHeader>
                        {selectedTransaction && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Transaction ID</label>
                                <div className="text-sm text-gray-600">{selectedTransaction.id}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <div className="text-sm text-gray-600">₦{selectedTransaction.amount.toLocaleString()}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Type</label>
                                <div className="text-sm text-gray-600">{selectedTransaction.transaction_type}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge className={getStatusColor(selectedTransaction.status)}>
                                  {selectedTransaction.status}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium">User ID</label>
                                <div className="text-sm text-gray-600">{selectedTransaction.user_id}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Created At</label>
                                <div className="text-sm text-gray-600">
                                  {new Date(selectedTransaction.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Risk Assessment</label>
                              <div className={`text-sm px-2 py-1 rounded mt-1 inline-block ${
                                riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {riskLevel.toUpperCase()} RISK
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactionsTab;
