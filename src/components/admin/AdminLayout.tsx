import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LogOut } from 'lucide-react';
import { Landmark, Bell } from 'lucide-react';

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
  {
    to: '/admin/kyc-analytics',
    icon: Landmark,
    label: 'KYC Analytics',
  },
  {
    to: '/admin/system-alerts',
    icon: Bell,
    label: 'System Alerts',
  },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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
        <header className="h-16 bg-white shadow flex items-center justify-end px-6 border-b gap-4">
          <span className="font-medium">Admin</span>
          <button
            className="flex items-center gap-2 px-3 py-1 rounded text-red-600 hover:bg-red-100 hover:text-red-800 transition"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout; 