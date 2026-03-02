import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthInput from '@/components/auth/AuthInput';
import PasswordInput from '@/components/auth/PasswordInput';
import CreciInput from '@/components/auth/CreciInput';

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  creci: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

interface InviteData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_valid: boolean;
  error_message: string | null;
}

const InviteSignupPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    creci: '',
  });
  const { signUp, user, isAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();
  const { getPath } = useAdminRoutes();

  useEffect(() => {
    if (user && isAdmin) {
      navigateAdmin('/admin');
    }
  }, [user, isAdmin, navigateAdmin]);

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setInviteError('Token de convite não fornecido');
        setValidating(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('validate_invite', {
          invite_token: token,
        });

        if (error) throw error;

        const result = data?.[0] as InviteData | undefined;
        
        if (!result) {
          setInviteError('Convite não encontrado');
        } else if (!result.is_valid) {
          setInviteError(result.error_message || 'Convite inválido');
        } else {
          setInviteData(result);
          setFormData((prev) => ({
            ...prev,
            email: result.email,
            name: result.name || '',
          }));
        }
      } catch (error: any) {
        console.error('Error validating invite:', error);
        setInviteError('Erro ao validar convite');
      } finally {
        setValidating(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      signupSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (!inviteData || !token) {
      toast.error('Convite inválido');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/admin`;
      
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name,
            creci: formData.creci,
          },
        },
      });

      if (signUpError) throw signUpError;

      await supabase.rpc('use_invite', {
        invite_token: token,
        user_id: null,
      });

      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      navigateAdmin('/admin/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = inviteData?.role === 'admin' ? 'Administrador' : 
                    inviteData?.role === 'corretor' ? 'Corretor' :
                    inviteData?.role === 'gestor' ? 'Gestor' :
                    inviteData?.role === 'marketing' ? 'Marketing' : 'Membro';

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        <AuthBackground />
        <div className="relative z-10">
          <Card className="w-full max-w-md shadow-xl border-border/30 bg-background">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-foreground mb-4" />
              <p className="text-muted-foreground">Validando convite...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        <AuthBackground />
        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-xl border-border/30 bg-background">
            <CardContent className="pt-8 pb-6 px-6 md:px-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Convite Inválido</h1>
              <p className="text-destructive text-sm mb-4">{inviteError}</p>
              <p className="text-sm text-muted-foreground mb-6">
                Entre em contato com o administrador para solicitar um novo convite.
              </p>
              <Button
                variant="outline"
                onClick={() => navigateAdmin('/admin/login')}
              >
                Voltar para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 px-4">
      <AuthBackground />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Title above card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white italic mb-3">
            Bem-vindo!
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-sm mx-auto">
            Você foi convidado como <span className="text-white font-semibold">{roleLabel}</span>. Crie sua conta para começar.
          </p>
        </div>

        {/* Card */}
        <Card className="w-full shadow-xl border-border/30 bg-background">
          <CardContent className="pt-8 pb-6 px-6 md:px-8">
            <h2 className="text-xl font-semibold text-center mb-6">
              Crie sua conta
            </h2>

            <form onSubmit={handleSignup} className="space-y-4">
              <AuthInput
                id="name"
                label="Nome completo"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                icon={User}
              />

              <AuthInput
                id="email"
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={() => {}}
                icon={Mail}
                helpText="O email não pode ser alterado pois está vinculado ao convite."
                disabled
              />

              <CreciInput
                id="creci"
                label="CRECI (opcional)"
                value={formData.creci}
                onChange={(value) => setFormData({ ...formData, creci: value })}
              />

              <PasswordInput
                id="password"
                label="Senha"
                value={formData.password}
                onChange={(value) => setFormData({ ...formData, password: value })}
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium mt-4"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Criar conta
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Já tem uma conta?{' '}
                <Link
                  to={getPath('/admin/login')}
                  className="text-foreground hover:underline font-semibold"
                >
                  Entrar
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteSignupPage;
