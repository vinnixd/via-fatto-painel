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
  const { tenant, loading: tenantLoading, error, domain, isTenantMember, isResolved } = useTenant();
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

  // Show loading while resolving tenant or auth
  if (tenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Domain not found
  if (error === 'DOMAIN_NOT_FOUND') {
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

  // Domain not verified
  if (error === 'DOMAIN_NOT_VERIFIED' && domain) {
    const txtHost = `_zatch-verify.${domain.hostname}`;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Verificação pendente</CardTitle>
            <CardDescription>
              Este domínio ainda não foi verificado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Domínio: {domain.hostname}</AlertTitle>
              <AlertDescription>
                Configure o registro DNS TXT abaixo para verificar a propriedade deste domínio.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Configuração DNS necessária:</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</label>
                  <div className="font-mono bg-background rounded px-3 py-2 border">TXT</div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Nome/Host</label>
                  <div className="font-mono bg-background rounded px-3 py-2 border text-sm break-all">
                    {txtHost}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Valor</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono bg-background rounded px-3 py-2 border text-sm break-all">
                      {domain.verify_token}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyToken}
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Próximos passos:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Adicione o registro TXT no seu provedor de DNS</li>
                <li>Aguarde a propagação (pode levar até 48h)</li>
                <li>Clique em "Verificar domínio" nas configurações do painel</li>
              </ol>
            </div>

            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Verificar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tenant inactive
  if (error === 'TENANT_INACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Conta suspensa</CardTitle>
            <CardDescription>
              Esta conta está temporariamente indisponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Acesso bloqueado</AlertTitle>
              <AlertDescription>
                Entre em contato com o suporte para mais informações.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generic resolution error
  if (error && !isResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Erro ao carregar</CardTitle>
            <CardDescription>
              Não foi possível carregar as informações do painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Código: {error}</AlertTitle>
              <AlertDescription>
                Tente recarregar a página ou entre em contato com o suporte.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recarregar página
            </Button>
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
