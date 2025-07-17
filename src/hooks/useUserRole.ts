import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_current_user_role');
        
        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default to user role
        } else {
          setRole(data || 'user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user'); // Default to user role
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || role === 'admin';
  const hasRole = (requiredRole: 'admin' | 'moderator' | 'user') => {
    if (!role) return false;
    
    const roleHierarchy = { user: 1, moderator: 2, admin: 3 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  return {
    role,
    loading,
    isAdmin,
    isModerator,
    hasRole
  };
};