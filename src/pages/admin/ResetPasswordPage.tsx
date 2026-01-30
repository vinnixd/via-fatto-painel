import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import AuthBackground from '@/components/auth/AuthBackground';
import PasswordInput from '@/components/auth/PasswordInput';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';

const passwordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { getPath } = useAdminRoutes();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Check if user came from a valid reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (!accessToken || type !== 'recovery') {
      toast.error('Link de recuperação inválido ou expirado');
      navigate(getPath('/admin/login'));
    }
  }, [navigate, getPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });
    
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Erro ao redefinir senha');
    } else {
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(getPath('/admin/login'));
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 px-4">
      <AuthBackground />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Title above card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white italic mb-3">
            {success ? 'Tudo certo!' : 'Nova senha'}
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-sm mx-auto">
            {success 
              ? 'Sua senha foi atualizada com sucesso' 
              : 'Digite sua nova senha abaixo'}
          </p>
        </div>

        {/* Card */}
        <Card className="w-full shadow-xl border-border/30 bg-background">
          <CardContent className="pt-8 pb-6 px-6 md:px-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold">
                  Senha atualizada!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Você será redirecionado para o login em instantes...
                </p>
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-center mb-6">
                  Redefina sua senha
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <PasswordInput
                    id="password"
                    label="Nova senha"
                    value={formData.password}
                    onChange={(value) => setFormData({ ...formData, password: value })}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="Confirmar nova senha"
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
                    Redefinir senha
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
