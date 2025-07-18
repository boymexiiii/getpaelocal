
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, role, isAdminRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = React.useState<any>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);

  // Helper: is this an admin route?
  const isAdminPath = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (user) {
      // Fetch profile to check for username
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setProfileLoading(false);
          });
      });
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (!loading && !profileLoading && user && profile && !profile.username && !['/profile', '/logout'].includes(location.pathname)) {
      navigate('/profile');
    }
  }, [loading, profileLoading, user, profile, location, navigate]);

  // Allow access to /admin if admin code was entered
  const adminCodeEntered = typeof window !== 'undefined' && (
    sessionStorage.getItem('admin_authenticated') === 'true' ||
    localStorage.getItem('admin_authenticated') === 'true'
  );

  // Robust admin authentication for /admin routes
  if (isAdminPath) {
    if (adminCodeEntered) {
      // Allow access to all /admin routes if code is entered
      return <>{children}</>;
    }
    if (loading || profileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      );
    }
    if (!user) {
      navigate('/admin-login');
      return null;
    }
    if (!isAdminRole(role)) {
      navigate('/admin-login');
      return null;
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  if (profile && !profile.username && !['/profile', '/logout'].includes(location.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
