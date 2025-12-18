import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import loginPattern from '@/assets/login-pattern.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const { signIn, user, canAccessAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: siteConfig } = useSiteConfig();

  useEffect(() => {
    if (user && canAccessAdmin) {
      navigate('/admin');
    }
  }, [user, canAccessAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse(loginData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
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

  const logoUrl = siteConfig?.logo_horizontal_url || siteConfig?.logo_url;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900">
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${loginPattern})`,
            backgroundSize: '150px',
            backgroundRepeat: 'repeat',
          }}
        />
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-12 w-auto brightness-0 invert"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-xl">VF</span>
              </div>
            )}
          </div>

          {/* Center text */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Gerencie seus<br />
              imóveis com<br />
              <span className="text-white/70">eficiência</span>
            </h1>
            <p className="text-white/60 text-lg max-w-md">
              Painel administrativo completo para gerenciar seu portfólio imobiliário, 
              clientes e muito mais.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-8">
            <div className="text-white/50 text-sm">
              © {new Date().getFullYear()} Via Fatto Imóveis
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-12 w-auto"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">VF</span>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="h-12 pl-12 bg-muted/50 border-border/50 focus:bg-background focus:border-primary transition-all"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 bg-muted/50 border-border/50 focus:bg-background focus:border-primary transition-all"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-neutral-900 hover:text-neutral-700 font-medium transition-colors"
                onClick={() => toast.info('Entre em contato com o administrador para recuperar sua senha.')}
              >
                Esqueci minha senha
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold group bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Acesso restrito a usuários autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
