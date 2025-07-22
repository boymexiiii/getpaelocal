import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FeatureFlag } from '@/types/networth';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all feature flags
  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');
      if (error) throw error;
      setFlags(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add feature flag
  const addFlag = useCallback(async (flag: Omit<FeatureFlag, 'id' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert([flag])
        .select();
      if (error) throw error;
      setFlags(prev => [...prev, ...(data || [])]);
    } catch (err: any) {
      setError(err.message || 'Failed to add feature flag');
    } finally {
      setLoading(false);
    }
  }, []);

  // Edit feature flag
  const editFlag = useCallback(async (id: string, updates: Partial<FeatureFlag>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      setFlags(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    } catch (err: any) {
      setError(err.message || 'Failed to update feature flag');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete feature flag
  const deleteFlag = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete feature flag');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    flags,
    loading,
    error,
    fetchFlags,
    addFlag,
    editFlag,
    deleteFlag,
  };
} 