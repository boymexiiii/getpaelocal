import React, { useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const FeatureFlagsAdmin: React.FC = () => {
  const {
    flags,
    loading,
    error,
    fetchFlags,
    editFlag,
  } = useFeatureFlags();

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = (id: string, enabled: boolean) => {
    editFlag(id, { enabled: !enabled });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Feature Flags</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="bg-white rounded shadow p-4">
        {flags.map(flag => (
          <li key={flag.id} className="flex justify-between items-center border-b last:border-b-0 py-2">
            <span>{flag.feature_name}</span>
            <button
              className={`px-3 py-1 rounded text-white ${flag.enabled ? 'bg-green-600' : 'bg-gray-400'}`}
              onClick={() => handleToggle(flag.id, flag.enabled)}
            >
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </li>
        ))}
        {flags.length === 0 && <li className="text-gray-400">No feature flags found.</li>}
      </ul>
    </div>
  );
};

export default FeatureFlagsAdmin; 