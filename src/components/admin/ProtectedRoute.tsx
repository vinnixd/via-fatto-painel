import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUserPermissions } from '@/hooks/useRolePermissions';
import { Loader2, ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  pageKey?: string;
  action?: 'view' | 'create' | 'edit' | 'delete';
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  pageKey, 
  action = 'view',
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading, canAccessAdmin } = useAuth();
  const { canAccess, isAdmin, loading: permLoading } = useCurrentUserPermissions();

  // Show loading state
  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/admin/auth" replace />;
  }

  // No admin access
  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  // Requires admin but user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta página é restrita a administradores do sistema.
          </p>
          <a 
            href="/admin" 
            className="inline-block mt-4 text-primary hover:underline"
          >
            ← Voltar para o Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check page-specific permission
  if (pageKey && !canAccess(pageKey, action)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página. 
            Entre em contato com um administrador se precisar de acesso.
          </p>
          <a 
            href="/admin" 
            className="inline-block mt-4 text-primary hover:underline"
          >
            ← Voltar para o Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
