import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ImportProgressBar from './ImportProgressBar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const getPageTitle = (pathname: string): { title: string; subtitle?: string } => {
  const routes: Record<string, { title: string; subtitle?: string }> = {
    '/admin': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
    '/admin/imoveis': { title: 'Imóveis', subtitle: 'Gerencie seus imóveis' },
    '/admin/imoveis/novo': { title: 'Novo Imóvel', subtitle: 'Cadastrar novo imóvel' },
    '/admin/mensagens': { title: 'Mensagens', subtitle: 'Central de mensagens' },
    '/admin/categorias': { title: 'Categorias', subtitle: 'Gerencie as categorias' },
    '/admin/designer': { title: 'Designer', subtitle: 'Personalize seu site' },
    '/admin/configuracoes': { title: 'Configurações', subtitle: 'Configurações do sistema' },
    '/admin/perfil': { title: 'Meu Perfil', subtitle: 'Gerencie seu perfil' },
    '/admin/usuarios': { title: 'Usuários', subtitle: 'Gerencie os usuários' },
    '/admin/portais': { title: 'Portais', subtitle: 'Integração com portais' },
    '/admin/integracoes': { title: 'Integrações', subtitle: 'Ferramentas de marketing' },
    '/admin/favoritos': { title: 'Favoritos', subtitle: 'Imóveis favoritados' },
    '/admin/dados': { title: 'Exportar', subtitle: 'Exportar dados' },
    '/admin/dados/importar': { title: 'Importar', subtitle: 'Importar dados' },
    '/admin/assinaturas': { title: 'Pagamentos', subtitle: 'Histórico de pagamentos' },
    '/admin/assinaturas/planos': { title: 'Planos', subtitle: 'Planos disponíveis' },
    '/admin/assinaturas/faturas': { title: 'Faturas', subtitle: 'Suas faturas' },
    '/admin/compartilhamento': { title: 'Compartilhamento', subtitle: 'Teste de compartilhamento' },
  };

  // Check for exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check for property edit page
  if (pathname.match(/^\/admin\/imoveis\/[^/]+$/)) {
    return { title: 'Editar Imóvel', subtitle: 'Atualize as informações do imóvel' };
  }

  // Check for portal config page
  if (pathname.match(/^\/admin\/portais\/[^/]+$/)) {
    return { title: 'Configurar Portal', subtitle: 'Configure a integração' };
  }

  return { title: 'Admin', subtitle: undefined };
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading, canAccessAdmin } = useAuth();
  const navigate = useNavigate();
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
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !canAccessAdmin) {
      navigate('/admin/login');
    }
  }, [user, loading, canAccessAdmin, navigate]);

  const { title, subtitle } = getPageTitle(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !canAccessAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-admin">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <main 
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <AdminHeader title={title} subtitle={subtitle} />
        {/* Global Import Progress Bar - visible on all admin pages */}
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <ImportProgressBar />
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
