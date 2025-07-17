
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  pendingKyc: number;
  activeAlerts: number;
  newUsersToday: number;
  transactionsToday: number;
  volumeToday: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    is_verified: boolean;
    kyc_level: number;
    role?: string;
  };
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface KycApplication {
  id: string;
  status: string;
  submitted_at: string;
  user_id: string;
  occupation: string;
  kyc_level: number;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useAdminData = () => {
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    pendingKyc: 0,
    activeAlerts: 0,
    newUsersToday: 0,
    transactionsToday: 0,
    volumeToday: 0
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycApplications, setKycApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  // Move page state here
  const [page, setPage] = useState(1);
  const pageSize = 100;

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Get auth user data with profiles - using raw query with auth integration
      const { data: authUsersData } = await supabase.auth.admin.listUsers();
      
      // Fetch profiles with pagination
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, is_verified, kyc_level, role, created_at, date_of_birth, phone, state, updated_at')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Merge auth data with profiles
      const mergedUsers = authUsersData.users.map(authUser => {
        const profile = profilesData?.find(p => p.id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || 'N/A',
          created_at: authUser.created_at,
          profiles: {
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'User',
            is_verified: profile?.is_verified || false,
            kyc_level: profile?.kyc_level || 1,
            role: profile?.role || 'user'
          }
        };
      });

      // Fetch recent transactions with user details
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          transaction_type,
          status,
          created_at,
          user_id,
          description,
          reference
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      const transformedTransactions = transactionsData?.map(transaction => {
        const user = mergedUsers.find(u => u.id === transaction.user_id);
        return {
          ...transaction,
          profiles: {
            first_name: user?.profiles.first_name || 'Unknown',
            last_name: user?.profiles.last_name || 'User'
          }
        };
      }) || [];

      // Fetch KYC applications with user details
      const { data: kycData } = await supabase
        .from('kyc_applications')
        .select(`
          id,
          status,
          submitted_at,
          user_id,
          occupation,
          kyc_level,
          bvn_verified,
          reviewer_notes,
          rejection_reason
        `)
        .order('submitted_at', { ascending: false });

      const transformedKyc = kycData?.map(kyc => {
        const user = mergedUsers.find(u => u.id === kyc.user_id);
        return {
          ...kyc,
          profiles: {
            first_name: user?.profiles.first_name || 'Unknown',
            last_name: user?.profiles.last_name || 'User',
            email: user?.email || 'N/A'
          }
        };
      }) || [];

      // Calculate comprehensive stats
      const totalUsers = mergedUsers.length;
      
      // Calculate active users based on recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Users who have made transactions recently or are newly registered
      const recentTransactionUsers = transformedTransactions
        .filter(t => new Date(t.created_at) >= sevenDaysAgo)
        .map(t => t.user_id);
      
      const recentlyCreatedUsers = mergedUsers
        .filter(u => new Date(u.created_at) >= sevenDaysAgo)
        .map(u => u.id);
      
      // Use Set to get unique active users
      const activeUserIds = new Set([...recentTransactionUsers, ...recentlyCreatedUsers]);
      const activeUsers = activeUserIds.size;
      const totalTransactions = transformedTransactions.length;
      const completedTransactions = transformedTransactions.filter(t => t.status === 'completed');
      const totalVolume = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const pendingKyc = transformedKyc.filter(k => k.status === 'submitted').length;
      
      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = mergedUsers.filter(u => new Date(u.created_at) >= today).length;
      const transactionsToday = transformedTransactions.filter(t => new Date(t.created_at) >= today).length;
      const volumeToday = transformedTransactions
        .filter(t => new Date(t.created_at) >= today && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      // Fetch system alerts
      const { data: alertsData } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      setStats({
        totalUsers,
        activeUsers,
        totalTransactions,
        totalVolume,
        pendingKyc,
        activeAlerts: alertsData?.length || 0,
        newUsersToday,
        transactionsToday,
        volumeToday
      });

      setUsers(mergedUsers);
      setTransactions(transformedTransactions);
      setKycApplications(transformedKyc);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      
      // Fallback to profile-only data if auth admin fails
      try {
        const { data: profilesOnly } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        const fallbackUsers = profilesOnly?.map(profile => ({
          id: profile.id,
          email: 'auth-restricted',
          created_at: profile.created_at,
          profiles: {
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            is_verified: profile.is_verified || false,
            kyc_level: profile.kyc_level || 1
          }
        })) || [];

        setUsers(fallbackUsers);
        setStats(prev => ({ ...prev, totalUsers: fallbackUsers.length }));
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
      
      toast({
        title: "Partial Load",
        description: "Some admin data may be limited due to permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return {
    stats,
    users,
    transactions,
    kycApplications,
    loading,
    fetchAdminData,
    page,
    setPage
  };
};

export type { AdminStats, User, Transaction, KycApplication };
