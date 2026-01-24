import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const AuthPage = () => {
  const { signIn, signUp, user, canAccessAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();
  const { data: siteConfig } = useSiteConfig();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user && canAccessAdmin) {
      navigateAdmin('/admin');
    }
  }, [user, canAccessAdmin, navigateAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: formData.email, password: formData.password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(formData.email, formData.password);
    setLoading(false);

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

    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, formData.name);
    setLoading(false);

    if (error) {
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } else {
      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      setIsSignup(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
    }
  };

  const logoUrl = siteConfig?.logo_horizontal_url || siteConfig?.logo_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-14 object-contain" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignup ? 'Criar Conta' : 'Bem-vindo de volta'}
          </CardTitle>
          <CardDescription>
            {isSignup 
              ? 'Preencha os dados para criar sua conta' 
              : 'Entre com suas credenciais para acessar o painel'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSignup ? 'Criar Conta' : 'Entrar'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                }}
                className="text-primary hover:underline font-medium"
              >
                {isSignup ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
