import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'unread')
        .in('type', ['kyc_approved', 'kyc_rejected', 'kyc_review']);
      if (!error && typeof count === 'number') {
        setUnreadCount(count);
      }
    };
    fetchUnread();
    // Optionally, poll every 30s
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="relative inline-block">
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        onClick={() => setDropdownOpen((open) => !open)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5 font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
      <NotificationDropdown open={dropdownOpen} onClose={() => setDropdownOpen(false)} />
    </div>
  );
};

export default NotificationBell; 