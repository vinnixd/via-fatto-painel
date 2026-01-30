import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Mail } from 'lucide-react';
import AuthBackground from '@/components/auth/AuthBackground';

const PendingApprovalPage = () => {
  const { user, signOut, canAccessAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already approved, redirect to admin
    if (user && canAccessAdmin) {
      navigate('/admin');
    }
    // If no user, redirect to login
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, canAccessAdmin, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 px-4">
      <AuthBackground />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="h-20 w-20 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Aguardando Aprovação
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-sm mx-auto">
            Sua conta foi criada com sucesso e está sendo analisada pela nossa equipe
          </p>
        </div>

        {/* Card */}
        <Card className="w-full shadow-xl border-border/30 bg-background">
          <CardContent className="pt-8 pb-6 px-6 md:px-8 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Um administrador irá analisar seu cadastro e aprovar sua conta em breve. 
                  Você receberá uma notificação assim que sua conta for ativada.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-4">
                  Enquanto isso, você pode sair e voltar mais tarde para verificar o status da sua conta.
                </p>
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
