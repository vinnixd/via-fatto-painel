import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthInput from '@/components/auth/AuthInput';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';
import PasswordInput from '@/components/auth/PasswordInput';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const LoginPage = () => {
  const { signIn, user, canAccessAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();
  const { getPath } = useAdminRoutes();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (user && canAccessAdmin) {
      navigateAdmin('/admin');
    }
  }, [user, canAccessAdmin, navigateAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      loginSchema.parse(formData);
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Entre na sua conta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              icon={Mail}
            />

            <PasswordInput
              id="password"
              label="Senha"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
            />

            <Button
              type="submit"
              className="w-full h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Entrar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="text-center space-y-2 pt-2">
              <Link
                to="#"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueceu a senha?
              </Link>
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link
                  to={getPath('/admin/auth/cadastro')}
                  className="text-foreground hover:underline font-semibold"
                >
                  Registre-se
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Dark background */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthBackground />
      </div>
    </div>
  );
};

export default LoginPage;
