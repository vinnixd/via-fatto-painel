import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, BadgeCheck } from 'lucide-react';
import { z } from 'zod';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    creci: '',
  });
  const { signUp, user, isAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();

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
          setSignupData((prev) => ({
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
      signupSchema.parse(signupData);
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
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signupData.name,
            creci: signupData.creci,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Mark invite as used
      await supabase.rpc('use_invite', {
        invite_token: token,
        user_id: null, // Will be set by the function if needed
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

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Convite Inválido</CardTitle>
            <CardDescription className="text-destructive">{inviteError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Entre em contato com o administrador para solicitar um novo convite.
            </p>
            <Button variant="outline" onClick={() => navigateAdmin('/admin/login')}>
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar sua Conta</CardTitle>
          <CardDescription>
            Você foi convidado como{' '}
            <span className="font-medium text-primary">
              {inviteData?.role === 'admin' ? 'Administrador' : 'Corretor'}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="pl-10"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 bg-muted"
                  value={signupData.email}
                  readOnly
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado pois está vinculado ao convite.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-creci">CRECI (opcional)</Label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-creci"
                  type="text"
                  placeholder="Ex: 12345-F"
                  className="pl-10"
                  value={signupData.creci}
                  onChange={(e) => setSignupData({ ...signupData, creci: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigateAdmin('/admin/login')}
                className="text-primary hover:underline"
              >
                Fazer login
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignupPage;
