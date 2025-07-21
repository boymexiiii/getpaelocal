import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NOTIF_TYPES = {
  kyc_approved: 'KYC Approved',
  kyc_rejected: 'KYC Rejected',
  kyc_review: 'KYC Under Review',
};

const NotificationDropdown: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !open) return;
    setLoading(true);
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => {
        setNotifications(data || []);
        setLoading(false);
      });
  }, [user, open]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleNotificationClick = async (notif: any) => {
    if (notif.status === 'unread') {
      await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notif.id);
      setNotifications((prev) => prev.map(n => n.id === notif.id ? { ...n, status: 'read' } : n));
    }
    // Navigate if relevant
    if (notif.type === 'kyc_approved' || notif.type === 'kyc_rejected' || notif.type === 'kyc_review') {
      navigate('/kyc');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 animate-fade-in">
      <div className="p-3 border-b font-semibold text-gray-700">Notifications</div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No notifications</div>
        ) : notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-4 py-3 border-b last:border-b-0 cursor-pointer flex flex-col ${notif.status === 'unread' ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
            onClick={() => handleNotificationClick(notif)}
          >
            <div className="font-medium text-sm text-gray-800 flex items-center gap-2">
              {NOTIF_TYPES[notif.type] || notif.title}
              {notif.status === 'unread' && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
            </div>
            <div className="text-xs text-gray-600 mt-1">{notif.message}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="p-2 text-center">
        <button className="text-blue-600 text-sm hover:underline" onClick={() => { navigate('/notifications'); onClose(); }}>View all</button>
      </div>
    </div>
  );
};

export default NotificationDropdown; 