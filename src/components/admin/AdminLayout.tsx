import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ImportProgressBar from './ImportProgressBar';
import OverdueInvoicePopup from './OverdueInvoicePopup';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_VERSION, SYSTEM_NAME, SYSTEM_YEAR } from '@/lib/constants';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { toAdminPath } from '@/hooks/useAdminRoutes';

const getPageTitle = (pathname: string): { title: string; subtitle?: string } => {
  // Normaliza o pathname para o formato admin
  const normalizedPath = pathname.startsWith('/admin') ? pathname : toAdminPath(pathname);
  
  const routes: Record<string, { title: string; subtitle?: string }> = {
    '/admin': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
    '/admin/administracao': { title: 'Administração', subtitle: 'Configurações do sistema' },
    '/admin/imoveis': { title: 'Imóveis', subtitle: 'Gerencie seus imóveis' },
    '/admin/imoveis/novo': { title: 'Novo Imóvel', subtitle: 'Cadastrar novo imóvel' },
    '/admin/mensagens': { title: 'Leads', subtitle: 'Gestão de leads' },
    '/admin/categorias': { title: 'Categorias', subtitle: 'Gerencie as categorias' },
    '/admin/configuracoes': { title: 'Configurações', subtitle: 'Configurações do sistema' },
    '/admin/perfil': { title: 'Meu Perfil', subtitle: 'Gerencie seu perfil' },
    '/admin/usuarios': { title: 'Equipe', subtitle: 'Gestão de usuários e permissões' },
    '/admin/portais': { title: 'Portais', subtitle: 'Integração com portais' },
    '/admin/favoritos': { title: 'Favoritos', subtitle: 'Imóveis favoritados' },
    '/admin/dados': { title: 'Exportar', subtitle: 'Exportar dados' },
    '/admin/dados/importar': { title: 'Importar', subtitle: 'Importar dados' },
    '/admin/compartilhamento': { title: 'Compartilhamento', subtitle: 'Teste de compartilhamento' },
    '/admin/membros': { title: 'Membros', subtitle: 'Gerencie sua equipe' },
    '/admin/blog': { title: 'Blog', subtitle: 'Gerencie os artigos do blog' },
    '/admin/blog/novo': { title: 'Novo Artigo', subtitle: 'Criar novo artigo do blog' },
  };

  // Check for exact match first
  if (routes[normalizedPath]) {
    return routes[normalizedPath];
  }

  // Check for property edit page
  if (normalizedPath.match(/^\/admin\/imoveis\/[^/]+$/)) {
    return { title: 'Editar Imóvel', subtitle: 'Atualize as informações do imóvel' };
  }

  // Check for portal config page
  if (normalizedPath.match(/^\/admin\/portais\/[^/]+$/)) {
    return { title: 'Configurar Portal', subtitle: 'Configure a integração' };
  }

  // Check for blog edit page
  if (normalizedPath.match(/^\/admin\/blog\/[^/]+$/)) {
    return { title: 'Editar Artigo', subtitle: 'Editar artigo do blog' };
  }

  return { title: 'Admin', subtitle: undefined };
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading, canAccessAdmin } = useAuth();
  const { navigateAdmin } = useAdminNavigation();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Persist sidebar state in localStorage
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('admin-sidebar-collapsed', String(newState));
  };

  useEffect(() => {
    if (!loading && !user) {
      navigateAdmin('/admin/login');
    }
  }, [user, loading, navigateAdmin]);

  useEffect(() => {
    if (!loading && user && !canAccessAdmin) {
      navigateAdmin('/admin/login');
    }
  }, [user, loading, canAccessAdmin, navigateAdmin]);

  const { title, subtitle } = getPageTitle(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !canAccessAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-admin flex flex-col">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <main 
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <AdminHeader title={title} subtitle={subtitle} />
        {/* Global Import Progress Bar - visible on all admin pages */}
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <ImportProgressBar />
        </div>
        <div className="flex-1">
          {children}
        </div>
        <OverdueInvoicePopup />
        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border">
          © {SYSTEM_YEAR} {SYSTEM_NAME} • v{APP_VERSION}
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;
