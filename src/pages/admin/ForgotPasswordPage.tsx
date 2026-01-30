import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthInput from '@/components/auth/AuthInput';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

const ForgotPasswordPage = () => {
  const { getPath } = useAdminRoutes();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse({ email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}${getPath('/admin/redefinir-senha')}`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } else {
      setEmailSent(true);
      toast.success('Email de recuperação enviado!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 px-4">
      <AuthBackground />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Title above card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white italic mb-3">
            Recuperar senha
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-sm mx-auto">
            {emailSent 
              ? 'Verifique sua caixa de entrada' 
              : 'Digite seu email para receber as instruções de recuperação'}
          </p>
        </div>

        {/* Card */}
        <Card className="w-full shadow-xl border-border/30 bg-background">
          <CardContent className="pt-8 pb-6 px-6 md:px-8">
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold">
                  Email enviado!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enviamos um link de recuperação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e spam.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setEmailSent(false)}
                >
                  Enviar novamente
                </Button>
                <Link
                  to={getPath('/admin/login')}
                  className="block text-sm text-primary hover:underline font-medium mt-4"
                >
                  <ArrowLeft className="h-4 w-4 inline mr-1" />
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-center mb-6">
                  Esqueceu sua senha?
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AuthInput
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={setEmail}
                    icon={Mail}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Enviar link de recuperação
                  </Button>

                  <Link
                    to={getPath('/admin/login')}
                    className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                  >
                    <ArrowLeft className="h-4 w-4 inline mr-1" />
                    Voltar para o login
                  </Link>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
