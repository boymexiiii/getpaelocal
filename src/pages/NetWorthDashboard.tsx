import React, { useEffect, useState } from 'react';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useUser } from '@clerk/clerk-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const NetWorthDashboard: React.FC = () => {
  const { user } = useUser();
  const userId = user?.id || '';
  const {
    assets,
    liabilities,
    loading,
    error,
    fetchNetWorth,
    addAsset,
    addLiability,
    editAsset,
    editLiability,
    deleteAsset,
    deleteLiability,
  } = useNetWorth(userId);

  const { flags, fetchFlags, loading: flagsLoading } = useFeatureFlags();
  React.useEffect(() => { fetchFlags(); }, [fetchFlags]);
  const netWorthEnabled = flags.find(f => f.feature_name === 'net_worth_dashboard' && f.enabled);

  if (flagsLoading) return <div className="p-6">Loading...</div>;
  if (!netWorthEnabled) {
    return <div className="p-6 text-red-500">Net Worth Dashboard is currently disabled by the admin.</div>;
  }

  const [assetForm, setAssetForm] = useState({ name: '', type: '', value: '', currency: 'NGN' });
  const [liabilityForm, setLiabilityForm] = useState({ name: '', type: '', value: '', currency: 'NGN' });
  const [formLoading, setFormLoading] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  const [editAssetForm, setEditAssetForm] = useState({ name: '', type: '', value: '', currency: 'NGN' });
  const [editLiabilityForm, setEditLiabilityForm] = useState({ name: '', type: '', value: '', currency: 'NGN' });

  useEffect(() => {
    if (userId) fetchNetWorth();
  }, [userId, fetchNetWorth]);

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    await addAsset({
      name: assetForm.name,
      type: assetForm.type,
      value: parseFloat(assetForm.value),
      currency: assetForm.currency,
      user_id: userId,
    });
    setAssetForm({ name: '', type: '', value: '', currency: 'NGN' });
    fetchNetWorth();
    setFormLoading(false);
  };

  const handleLiabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    await addLiability({
      name: liabilityForm.name,
      type: liabilityForm.type,
      value: parseFloat(liabilityForm.value),
      currency: liabilityForm.currency,
      user_id: userId,
    });
    setLiabilityForm({ name: '', type: '', value: '', currency: 'NGN' });
    fetchNetWorth();
    setFormLoading(false);
  };

  const handleEditAsset = (asset: any) => {
    setEditingAssetId(asset.id);
    setEditAssetForm({ name: asset.name, type: asset.type, value: asset.value.toString(), currency: asset.currency });
  };
  const handleEditLiability = (liability: any) => {
    setEditingLiabilityId(liability.id);
    setEditLiabilityForm({ name: liability.name, type: liability.type, value: liability.value.toString(), currency: liability.currency });
  };
  const handleSaveAsset = async (id: string) => {
    setFormLoading(true);
    await editAsset(id, {
      name: editAssetForm.name,
      type: editAssetForm.type,
      value: parseFloat(editAssetForm.value),
      currency: editAssetForm.currency,
    });
    setEditingAssetId(null);
    fetchNetWorth();
    setFormLoading(false);
  };
  const handleSaveLiability = async (id: string) => {
    setFormLoading(true);
    await editLiability(id, {
      name: editLiabilityForm.name,
      type: editLiabilityForm.type,
      value: parseFloat(editLiabilityForm.value),
      currency: editLiabilityForm.currency,
    });
    setEditingLiabilityId(null);
    fetchNetWorth();
    setFormLoading(false);
  };
  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Delete this asset?')) {
      setFormLoading(true);
      await deleteAsset(id);
      fetchNetWorth();
      setFormLoading(false);
    }
  };
  const handleDeleteLiability = async (id: string) => {
    if (window.confirm('Delete this liability?')) {
      setFormLoading(true);
      await deleteLiability(id);
      fetchNetWorth();
      setFormLoading(false);
    }
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Pie chart data
  const pieData = [
    { name: 'Assets', value: totalAssets },
    { name: 'Liabilities', value: totalLiabilities },
  ];

  // Mock net worth trend (last 6 months, using current net worth for all months for now)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('en', { month: 'short', year: '2-digit' });
  });
  const trendData = months.map(month => ({ month, netWorth }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Net Worth Dashboard</h1>
      {/* Asset Form */}
      <form className="mb-4 flex gap-2" onSubmit={handleAssetSubmit}>
        <input required className="border rounded px-2 py-1" placeholder="Asset Name" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} />
        <input required className="border rounded px-2 py-1" placeholder="Type (e.g. crypto)" value={assetForm.type} onChange={e => setAssetForm(f => ({ ...f, type: e.target.value }))} />
        <input required className="border rounded px-2 py-1" placeholder="Value" type="number" value={assetForm.value} onChange={e => setAssetForm(f => ({ ...f, value: e.target.value }))} />
        <select className="border rounded px-2 py-1" value={assetForm.currency} onChange={e => setAssetForm(f => ({ ...f, currency: e.target.value }))}>
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={formLoading}>Add Asset</button>
      </form>
      {/* Liability Form */}
      <form className="mb-4 flex gap-2" onSubmit={handleLiabilitySubmit}>
        <input required className="border rounded px-2 py-1" placeholder="Liability Name" value={liabilityForm.name} onChange={e => setLiabilityForm(f => ({ ...f, name: e.target.value }))} />
        <input required className="border rounded px-2 py-1" placeholder="Type (e.g. loan)" value={liabilityForm.type} onChange={e => setLiabilityForm(f => ({ ...f, type: e.target.value }))} />
        <input required className="border rounded px-2 py-1" placeholder="Value" type="number" value={liabilityForm.value} onChange={e => setLiabilityForm(f => ({ ...f, value: e.target.value }))} />
        <select className="border rounded px-2 py-1" value={liabilityForm.currency} onChange={e => setLiabilityForm(f => ({ ...f, currency: e.target.value }))}>
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={formLoading}>Add Liability</button>
      </form>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="mb-6">
        <div className="text-lg">Total Net Worth:</div>
        <div className="text-3xl font-bold">₦{netWorth.toLocaleString()}</div>
        <div className="flex gap-8 mt-2">
          <div>
            <div className="text-sm text-gray-500">Assets</div>
            <div className="text-xl">₦{totalAssets.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Liabilities</div>
            <div className="text-xl">₦{totalLiabilities.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-semibold mb-2">Assets</h2>
          <ul className="bg-white rounded shadow p-4">
            {assets.map(a => (
              <li key={a.id} className="border-b last:border-b-0 py-2 flex justify-between items-center gap-2">
                {editingAssetId === a.id ? (
                  <>
                    <input className="border rounded px-1 w-20" value={editAssetForm.name} onChange={e => setEditAssetForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="border rounded px-1 w-20" value={editAssetForm.type} onChange={e => setEditAssetForm(f => ({ ...f, type: e.target.value }))} />
                    <input className="border rounded px-1 w-20" type="number" value={editAssetForm.value} onChange={e => setEditAssetForm(f => ({ ...f, value: e.target.value }))} />
                    <select className="border rounded px-1 w-16" value={editAssetForm.currency} onChange={e => setEditAssetForm(f => ({ ...f, currency: e.target.value }))}>
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                    <button type="button" className="text-green-600" onClick={() => handleSaveAsset(a.id)}><Check size={18} /></button>
                    <button type="button" className="text-gray-400" onClick={() => setEditingAssetId(null)}><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <span>{a.name} ({a.type})</span>
                    <span>₦{a.value.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">{a.currency}</span>
                    <button type="button" className="text-blue-600" onClick={() => handleEditAsset(a)}><Pencil size={16} /></button>
                    <button type="button" className="text-red-600" onClick={() => handleDeleteAsset(a.id)}><Trash2 size={16} /></button>
                  </>
                )}
              </li>
            ))}
            {assets.length === 0 && <li className="text-gray-400">No assets yet.</li>}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Liabilities</h2>
          <ul className="bg-white rounded shadow p-4">
            {liabilities.map(l => (
              <li key={l.id} className="border-b last:border-b-0 py-2 flex justify-between items-center gap-2">
                {editingLiabilityId === l.id ? (
                  <>
                    <input className="border rounded px-1 w-20" value={editLiabilityForm.name} onChange={e => setEditLiabilityForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="border rounded px-1 w-20" value={editLiabilityForm.type} onChange={e => setEditLiabilityForm(f => ({ ...f, type: e.target.value }))} />
                    <input className="border rounded px-1 w-20" type="number" value={editLiabilityForm.value} onChange={e => setEditLiabilityForm(f => ({ ...f, value: e.target.value }))} />
                    <select className="border rounded px-1 w-16" value={editLiabilityForm.currency} onChange={e => setEditLiabilityForm(f => ({ ...f, currency: e.target.value }))}>
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                    <button type="button" className="text-green-600" onClick={() => handleSaveLiability(l.id)}><Check size={18} /></button>
                    <button type="button" className="text-gray-400" onClick={() => setEditingLiabilityId(null)}><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <span>{l.name} ({l.type})</span>
                    <span>₦{l.value.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">{l.currency}</span>
                    <button type="button" className="text-blue-600" onClick={() => handleEditLiability(l)}><Pencil size={16} /></button>
                    <button type="button" className="text-red-600" onClick={() => handleDeleteLiability(l.id)}><Trash2 size={16} /></button>
                  </>
                )}
              </li>
            ))}
            {liabilities.length === 0 && <li className="text-gray-400">No liabilities yet.</li>}
          </ul>
        </div>
      </div>
      {/* Asset vs. Liability PieChart */}
      <div className="mb-6">
        <div className="bg-gray-100 rounded p-6">
          <h3 className="font-semibold mb-2">Asset vs. Liability Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={v => `₦${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Net Worth Trend LineChart */}
      <div className="mb-6">
        <div className="bg-gray-100 rounded p-6">
          <h3 className="font-semibold mb-2">Net Worth Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip formatter={v => `₦${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="netWorth" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default NetWorthDashboard; 