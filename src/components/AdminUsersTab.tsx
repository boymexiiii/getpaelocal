
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, UserCog, Shield, Wallet, Activity, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminUserActions from './AdminUserActions';
import { User } from '@/hooks/useAdminData';

interface AdminUsersTabProps {
  users: User[];
  onUserUpdate: () => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onUserUpdate }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.profiles?.first_name + ' ' + user.profiles?.last_name)
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'verified' && user.profiles?.is_verified) ||
                         (statusFilter === 'unverified' && !user.profiles?.is_verified);
    
    const matchesKyc = kycFilter === 'all' || 
                      user.profiles?.kyc_level?.toString() === kycFilter;
    
    return matchesSearch && matchesStatus && matchesKyc;
  });

  const handleSuspendUser = async (userId: string) => {
    setLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Suspended",
        description: "User account has been suspended successfully",
      });

      onUserUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Activated",
        description: "User account has been activated successfully",
      });

      onUserUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleChangeKycLevel = async (userId: string, newLevel: number) => {
    setLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_level: newLevel })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "KYC Level Updated",
        description: `User KYC level changed to Level ${newLevel}`,
      });

      onUserUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update KYC level",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const getKycLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalUsers = filteredUsers.length;
  const verifiedUsers = filteredUsers.filter(u => u.profiles?.is_verified).length;
  const kycLevel2Users = filteredUsers.filter(u => u.profiles?.kyc_level === 2).length;
  const kycLevel3Users = filteredUsers.filter(u => u.profiles?.kyc_level === 3).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{verifiedUsers}</div>
            <div className="text-sm text-gray-500">Verified Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{kycLevel2Users}</div>
            <div className="text-sm text-gray-500">KYC Level 2</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{kycLevel3Users}</div>
            <div className="text-sm text-gray-500">KYC Level 3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Management
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="KYC Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">
                        {user.profiles?.first_name} {user.profiles?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={user.profiles?.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.profiles?.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Badge className={getKycLevelColor(user.profiles?.kyc_level || 1)}>
                        KYC Level {user.profiles?.kyc_level || 1}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>User Management</DialogTitle>
                      </DialogHeader>
                      {selectedUser && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Full Name</label>
                              <div className="text-sm text-gray-600">
                                {selectedUser.profiles?.first_name} {selectedUser.profiles?.last_name}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <div className="text-sm text-gray-600">{selectedUser.email}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Badge className={selectedUser.profiles?.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {selectedUser.profiles?.is_verified ? 'Verified' : 'Unverified'}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium">KYC Level</label>
                              <Badge className={getKycLevelColor(selectedUser.profiles?.kyc_level || 1)}>
                                Level {selectedUser.profiles?.kyc_level || 1}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Account Actions</label>
                              <div className="flex gap-2">
                                {selectedUser.profiles?.is_verified ? (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleSuspendUser(selectedUser.id)}
                                    disabled={loading === selectedUser.id}
                                    className="flex items-center gap-2"
                                  >
                                    <Lock className="h-4 w-4" />
                                    {loading === selectedUser.id ? 'Processing...' : 'Suspend User'}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleActivateUser(selectedUser.id)}
                                    disabled={loading === selectedUser.id}
                                    className="flex items-center gap-2"
                                  >
                                    <Unlock className="h-4 w-4" />
                                    {loading === selectedUser.id ? 'Processing...' : 'Activate User'}
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">KYC Level Management</label>
                              <div className="flex gap-2">
                                {[1, 2, 3].map((level) => (
                                  <Button
                                    key={level}
                                    variant={selectedUser.profiles?.kyc_level === level ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleChangeKycLevel(selectedUser.id, level)}
                                    disabled={loading === selectedUser.id}
                                  >
                                    Level {level}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">User Activity</label>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Activity className="h-4 w-4" />
                                  <span className="text-sm">User joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <AdminUserActions user={user} onUserUpdate={onUserUpdate} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersTab;
