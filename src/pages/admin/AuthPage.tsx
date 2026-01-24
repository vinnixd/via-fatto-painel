import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import { SignIn1 } from '@/components/ui/modern-stunning-sign-in';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';

const AuthPage = () => {
  const { signIn, user, canAccessAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();
  const { data: siteConfig } = useSiteConfig();

  useEffect(() => {
    if (user && canAccessAdmin) {
      navigateAdmin('/admin');
    }
  }, [user, canAccessAdmin, navigateAdmin]);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
    }
  };

  const logoUrl = siteConfig?.logo_horizontal_url || siteConfig?.logo_url;

  return (
    <SignIn1 
      onSubmit={handleLogin}
      logoUrl={logoUrl}
    />
  );
};

export default AuthPage;
