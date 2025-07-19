import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Placeholder for stats cards */}
          <div className="bg-white rounded-lg shadow p-4">Total Users</div>
          <div className="bg-white rounded-lg shadow p-4">Total Volume</div>
          <div className="bg-white rounded-lg shadow p-4">Pending KYC</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          {/* Placeholder for recent activity or quick links */}
          Recent Activity / Quick Links
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 