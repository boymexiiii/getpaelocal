
import React from 'react';
import { Users, DollarSign, UserCheck, Shield } from 'lucide-react';
import AdminStatsCard from './AdminStatsCard';
import { AdminStats } from '@/hooks/useAdminData';

interface AdminDashboardStatsProps {
  stats: AdminStats;
}

const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatsCard
        title="Total Users"
        value={stats.totalUsers}
        description={`${stats.activeUsers} verified users`}
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
      <AdminStatsCard
        title="Transaction Volume"
        value={`₦${stats.totalVolume.toLocaleString()}`}
        description={`${stats.totalTransactions} total transactions`}
        icon={DollarSign}
        trend={{ value: 8, isPositive: true }}
      />
      <AdminStatsCard
        title="New Users Today"
        value={stats.newUsersToday}
        description="Registered today"
        icon={UserCheck}
        trend={{ value: 15, isPositive: true }}
      />
      <AdminStatsCard
        title="Pending KYC"
        value={stats.pendingKyc}
        description="Applications awaiting review"
        icon={Shield}
      />
    </div>
  );
};

export default AdminDashboardStats;
