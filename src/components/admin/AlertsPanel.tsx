import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('provider', 'flutterwave')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error) setAlerts(data || []);
      setLoading(false);
    };
    fetchAlerts();
    // Optionally, poll every 30s for new alerts
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading alerts...</div>;
  if (alerts.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
      <h2 className="text-red-700 font-bold mb-2 text-lg">⚠️ Failed Wallet Credits (Flutterwave)</h2>
      <ul className="space-y-2">
        {alerts.map(alert => (
          <li key={alert.id} className="text-red-800 text-sm">
            <b>{alert.event}</b> at {new Date(alert.created_at).toLocaleString()}<br/>
            <span className="break-all">{alert.payload && typeof alert.payload === 'object' ? JSON.stringify(alert.payload) : String(alert.payload)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertsPanel; 