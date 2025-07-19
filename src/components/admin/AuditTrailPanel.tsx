import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuditTrailPanel: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setActions(data || []);
      setLoading(false);
    };
    fetchActions();
    const interval = setInterval(fetchActions, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading audit trail...</div>;
  if (actions.length === 0) return <div className="text-sm text-gray-500">No recent admin actions.</div>;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
      <h2 className="text-gray-700 font-bold mb-2 text-lg">Admin Audit Trail</h2>
      <ul className="space-y-2">
        {actions.map(action => (
          <li key={action.id} className="text-gray-800 text-sm">
            <b>{action.action}</b> on <b>{action.target_type}</b> <code>{action.target_id}</code> by <code>{action.admin_id}</code> at {new Date(action.created_at).toLocaleString()}<br/>
            {action.details && <span className="break-all text-xs text-gray-500">{JSON.stringify(action.details)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditTrailPanel; 