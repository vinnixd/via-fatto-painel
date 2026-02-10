import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Loader2, ArrowRight } from 'lucide-react';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';
import { z } from 'zod';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthInput from '@/components/auth/AuthInput';
import PhoneInput from '@/components/auth/PhoneInput';
import PasswordInput from '@/components/auth/PasswordInput';
import CreciInput from '@/components/auth/CreciInput';

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(14, 'Telefone inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const CadastroPage = () => {
  const { signUp, user, canAccessAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();
  const { getPath } = useAdminRoutes();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    creci: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user && canAccessAdmin) {
      navigateAdmin('/admin');
    }
  }, [user, canAccessAdmin, navigateAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error('Você deve aceitar os Termos de Uso');
      return;
    }

    try {
      signupSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signUp(
      formData.email, 
      formData.password, 
      formData.name, 
      formData.phone, 
      formData.creci
    );
    setLoading(false);

    if (error) {
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } else {
      toast.success('Conta criada! Aguarde a aprovação de um administrador.');
      navigateAdmin('/admin/aguardando-aprovacao');
    }
  };

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
            Crie sua conta em poucos minutos e envie seus documentos para o nosso time de verificação
          </p>
        </div>

        {/* Card */}
        <Card className="w-full shadow-xl border-border/30 bg-background">
          <CardContent className="pt-8 pb-6 px-6 md:px-8">
            <h2 className="text-xl font-semibold text-center mb-6">
              Crie sua conta
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={(value) => setFormData({ ...formData, email: value })}
                icon={Mail}
              />

              <PhoneInput
                id="phone"
                label="Telefone"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
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

              {/* Terms */}
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={setAcceptedTerms}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  Li e concordo com os{' '}
                  <a href="#" className="text-foreground hover:underline font-medium">
                    Termos de Uso
                  </a>
                </label>
              </div>

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

export default CadastroPage;
