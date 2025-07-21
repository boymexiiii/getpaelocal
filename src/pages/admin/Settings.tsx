import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const SettingsAdminPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [dailyLimit, setDailyLimit] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/functions/v1/admin-settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setApiKey(data.api_key || '');
        setDailyLimit(Number(data.daily_limit) || 0);
        setMaintenanceMode(data.maintenance_mode === 'true');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (updates: Record<string, any>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/functions/v1/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to save settings');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = () => handleSave({ api_key: apiKey });
  const handleSaveLimits = () => handleSave({ daily_limit: dailyLimit });
  const handleToggleMaintenance = () => {
    setMaintenanceMode(v => {
      const newValue = !v;
      handleSave({ maintenance_mode: newValue.toString() });
      return newValue;
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Platform Settings</h1>
        {loading ? (
          <div>Loading settings...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="max-w-md"
                  />
                  <Button onClick={handleSaveApiKey} disabled={saving}>Save API Key</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transaction Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <label className="mr-2">Daily Limit (₦):</label>
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Number(e.target.value))}
                    className="w-32"
                  />
                  <Button onClick={handleSaveLimits} disabled={saving}>Save Limits</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} />
                  <span>{maintenanceMode ? 'Enabled' : 'Disabled'}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsAdminPage; 