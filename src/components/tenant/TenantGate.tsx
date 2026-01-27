import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, ShieldX, Globe, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState } from 'react';
import { toast } from 'sonner';

interface TenantGateProps {
  children: React.ReactNode;
}

/**
 * Gate component that blocks access based on tenant resolution and user membership
 */
export const TenantGate = ({ children }: TenantGateProps) => {
  const { tenant, loading: tenantLoading, error, domain, isTenantMember, isResolved, userRoleLoading } = useTenant();
  const { user, loading: authLoading, signOut } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyToken = () => {
    if (domain?.verify_token) {
      navigator.clipboard.writeText(domain.verify_token);
      setCopied(true);
      toast.success('Token copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  // Show loading while resolving tenant, auth, or user role
  if (tenantLoading || authLoading || (user && userRoleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Domain not found or not configured
  if (error === 'DOMAIN_NOT_FOUND' || error === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Painel não configurado</CardTitle>
            <CardDescription>
              Este domínio não está configurado para acessar nenhum painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Domínio: {window.location.hostname}</AlertTitle>
              <AlertDescription>
                Se você é o administrador, adicione este domínio nas configurações do seu painel.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Como configurar:</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Acesse o painel administrativo principal</li>
                <li>Vá em Configurações → Domínios</li>
                <li>Adicione este domínio como tipo "Admin"</li>
                <li>Configure o registro DNS TXT para verificação</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User authenticated but not a member of this tenant
  if (user && tenant && !isTenantMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acesso negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar este painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Usuário: {user.email}</AlertTitle>
              <AlertDescription>
                Sua conta não está vinculada à empresa {tenant.name}.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Se você deveria ter acesso, entre em contato com o administrador da empresa para ser adicionado como membro.
              </p>
            </div>

            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
};
