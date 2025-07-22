
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  isAdminRole: (role: string | null) => boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { sendWelcomeEmail } = useNotifications();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          console.log('Auth state changed:', event, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log('Initial session:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper to check for admin roles
  const isAdminRole = (role: string | null) => {
    return ['admin', 'superadmin', 'support', 'compliance'].includes(role || '');
  };

  useEffect(() => {
    // After setting user, fetch role from profiles
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setRole(data?.role || 'user');
        });
    } else {
      setRole(null);
    }
  }, [user]);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // After signup, update the profiles table with extra fields
        if (data?.user) {
          await supabase.from('profiles').update({
            full_name: `${userData.first_name} ${userData.last_name}`.trim()
          }).eq('id', data.user.id);

          // Send welcome email notification
          await sendWelcomeEmail({
            userId: data.user.id,
            userName: userData.first_name || 'User',
            userEmail: email
          });
        }
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
      }

      return { error };
    } catch (err) {
      console.error('SignUp error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      async function getDeviceInfo() {
        const imported: any = await import('ua-parser-js');
        const UAParser: any = imported.default || imported;
        const parser = new UAParser();
        const ua = parser.getResult();
        return {
          device: ua.device.type || 'Desktop',
          browser: ua.browser.name + ' ' + ua.browser.version,
          os: ua.os.name + ' ' + ua.os.version,
        };
      }

      if (!error && data?.user) {
        // Device/Browser detection
        const { device, browser, os } = await getDeviceInfo();
        // Location detection
        let location = '';
        try {
          const locRes = await fetch('https://ipapi.co/json/');
          const locJson = await locRes.json();
          location = locJson.city ? `${locJson.city}, ${locJson.country_name}` : locJson.country_name || '';
        } catch {}
        // Record session
        await fetch('/functions/v1/user-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: data.user.id,
            device,
            browser,
            os,
            location,
            session_id: data.session?.access_token || '',
          })
        });
      }

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome Back!",
          description: "You have successfully signed in.",
        });
      }

      return { error };
    } catch (err) {
      console.error('SignIn error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
      }
    } catch (err) {
      console.error('SignOut error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions.",
        });
      }

      return { error };
    } catch (err) {
      console.error('Reset password error:', err);
      return { error: err };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Password Update Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
      }

      return { error };
    } catch (err) {
      console.error('Update password error:', err);
      return { error: err };
    }
  };

  // Add logout alias for backward compatibility
  const logout = signOut;

  const value = {
    user,
    session,
    loading,
    role,
    isAdminRole,
    signUp,
    signIn,
    signOut,
    logout,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
