import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isMarketing: boolean;
  isCorretor: boolean;
  canAccessAdmin: boolean;
  isPendingApproval: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; isPending?: boolean }>;
  signUp: (email: string, password: string, name: string, phone?: string, creci?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [isMarketing, setIsMarketing] = useState(false);
  const [isCorretor, setIsCorretor] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const roles = data?.map(r => r.role) || [];
    setIsAdmin(roles.includes('admin'));
    setIsGestor(roles.includes('gestor'));
    setIsMarketing(roles.includes('marketing'));
    setIsCorretor(roles.includes('corretor'));
  };

  const checkUserStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();
    
    setIsPendingApproval(data?.status === 'pending');
    return data?.status;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
            checkUserStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsGestor(false);
          setIsMarketing(false);
          setIsCorretor(false);
          setIsPendingApproval(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkUserRole(session.user.id);
        checkUserStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const canAccessAdmin = (isAdmin || isGestor || isMarketing || isCorretor) && !isPendingApproval;

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error };
    }

    // Check if user is pending approval
    if (data.user) {
      const status = await checkUserStatus(data.user.id);
      if (status === 'pending') {
        return { error: null, isPending: true };
      }
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string, phone?: string, creci?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, phone, creci }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin, 
      isGestor, 
      isMarketing, 
      isCorretor, 
      canAccessAdmin, 
      isPendingApproval,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
