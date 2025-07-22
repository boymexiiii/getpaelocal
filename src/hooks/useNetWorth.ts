import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset, Liability } from '@/types/networth';

export function useNetWorth(userId: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assets and liabilities
  const fetchNetWorth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', userId);
      const { data: liabilitiesData, error: liabilitiesError } = await supabase
        .from('user_liabilities')
        .select('*')
        .eq('user_id', userId);
      if (assetsError || liabilitiesError) {
        throw assetsError || liabilitiesError;
      }
      setAssets(assetsData || []);
      setLiabilities(liabilitiesData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch net worth data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Add asset
  const addAsset = useCallback(async (asset: Omit<Asset, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_assets')
        .insert([{ ...asset, user_id: userId }])
        .select();
      if (error) throw error;
      setAssets(prev => [...prev, ...(data || [])]);
    } catch (err: any) {
      setError(err.message || 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Edit asset
  const editAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_assets')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      setAssets(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    } catch (err: any) {
      setError(err.message || 'Failed to update asset');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete asset
  const deleteAsset = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('user_assets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add liability
  const addLiability = useCallback(async (liability: Omit<Liability, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_liabilities')
        .insert([{ ...liability, user_id: userId }])
        .select();
      if (error) throw error;
      setLiabilities(prev => [...prev, ...(data || [])]);
    } catch (err: any) {
      setError(err.message || 'Failed to add liability');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Edit liability
  const editLiability = useCallback(async (id: string, updates: Partial<Liability>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_liabilities')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      setLiabilities(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
    } catch (err: any) {
      setError(err.message || 'Failed to update liability');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete liability
  const deleteLiability = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('user_liabilities')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setLiabilities(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete liability');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    assets,
    liabilities,
    loading,
    error,
    fetchNetWorth,
    addAsset,
    editAsset,
    deleteAsset,
    addLiability,
    editLiability,
    deleteLiability,
  };
} 