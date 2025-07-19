import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const SettingsAdminPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Platform Settings</h1>
        <div className="bg-white rounded shadow p-6">
          {/* Placeholder for settings management */}
          <p>Manage API keys, transaction limits, and other platform settings here.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsAdminPage; 