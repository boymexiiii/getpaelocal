import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const adminNav = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Transactions', path: '/admin/transactions' },
  { label: 'Bills', path: '/admin/bills' },
  { label: 'Bank Transfers', path: '/admin/bank-transfers' },
  { label: 'KYC', path: '/admin/kyc' },
  { label: 'Notifications', path: '/admin/notifications' },
  { label: 'Settings', path: '/admin/settings' },
  { label: 'Audit Logs', path: '/admin/audit-logs' },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b">Admin Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          {adminNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded hover:bg-purple-100 transition ${location.pathname === item.path ? 'bg-purple-200 font-semibold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white shadow flex items-center justify-end px-6 border-b">
          <span className="font-medium">Admin</span>
          {/* Add profile dropdown, logout, etc. here */}
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout; 