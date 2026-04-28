import { useLocation } from 'react-router-dom';
import AdminLink from '@/components/admin/AdminLink';
import { cn } from '@/lib/utils';
import { SUPPORT_WHATSAPP } from '@/lib/constants';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Headphones,
  Settings,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  adminPath: string;
  roles?: ('admin' | 'gestor' | 'marketing' | 'corretor')[];
  tenantRoles?: ('owner' | 'admin' | 'agent')[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', adminPath: '/admin' },
  { icon: Building2, label: 'Imóveis', adminPath: '/admin/imoveis' },
  { icon: MessageSquare, label: 'Leads', adminPath: '/admin/mensagens' },
  { icon: FileText, label: 'Blog', adminPath: '/admin/blog' },
  { icon: Users, label: 'Equipe', adminPath: '/admin/usuarios', roles: ['admin'] },
  { icon: Settings, label: 'Administração', adminPath: '/admin/administracao', roles: ['admin', 'gestor', 'marketing'] },
  { icon: CreditCard, label: 'Assinaturas', adminPath: '/admin/assinaturas', roles: ['admin'] },
];

const profileItem: MenuItem = { icon: User, label: 'Meu Perfil', adminPath: '/admin/perfil' };

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const AdminSidebar = ({ collapsed, onToggle, mobileOpen = false, onMobileClose }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, user, isAdmin, isGestor, isMarketing, isCorretor } = useAuth();
  const { userRole: tenantUserRole, isOwnerOrAdmin: isTenantAdmin } = useTenant();
  const { data: siteConfig } = useSiteConfig();
  const { getPath, normalizeCurrentPath } = useAdminRoutes();

  // Normaliza o pathname atual para comparação
  const normalizedPath = normalizeCurrentPath(location.pathname);

  // Filter menu items based on user role (legacy system + tenant system)
  const visibleMenuItems = menuItems.filter((item) => {
    // Check tenant-based roles first
    if (item.tenantRoles) {
      if (!tenantUserRole) return false;
      if (!item.tenantRoles.includes(tenantUserRole)) return false;
    }
    
    // Check legacy roles
    if (!item.roles) return true;
    if (isAdmin && item.roles.includes('admin')) return true;
    if (isGestor && item.roles.includes('gestor')) return true;
    if (isMarketing && item.roles.includes('marketing')) return true;
    if (isCorretor && item.roles.includes('corretor')) return true;
    return false;
  });

  const isProfileActive = normalizedPath === profileItem.adminPath;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-transform md:transition-all duration-300 z-50 flex flex-col',
          // Mobile: full width drawer, slides in/out
          'w-64 -translate-x-full',
          mobileOpen && 'translate-x-0',
          // Desktop: always visible, collapsible width
          'md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {/* Expanded logo: visible when not collapsed (always shown on mobile drawer) */}
        <AdminLink
          to="/admin"
          onClick={onMobileClose}
          className={cn('flex items-center gap-2', collapsed && 'md:hidden')}
        >
          {(siteConfig?.logo_horizontal_url || siteConfig?.logo_url) ? (
            <img
              src={siteConfig.logo_horizontal_url || siteConfig.logo_url}
              alt={siteConfig?.seo_title || 'Logo'}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <>
              <div className="h-8 w-8 rounded-lg bg-sidebar-foreground flex items-center justify-center">
                <Building2 className="h-5 w-5 text-sidebar-background" />
              </div>
              <span className="font-bold text-lg">Painel Admin</span>
            </>
          )}
        </AdminLink>
        {/* Collapsed logo: only on desktop when collapsed */}
        {collapsed && (
          <AdminLink to="/admin" className="mx-auto hidden md:block">
            {(siteConfig?.logo_symbol_url || siteConfig?.logo_url) ? (
              <img
                src={siteConfig.logo_symbol_url || siteConfig.logo_url}
                alt={siteConfig?.seo_title || 'Logo'}
                className="h-8 w-8 object-contain brightness-0 invert"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-sidebar-foreground flex items-center justify-center">
                <Building2 className="h-5 w-5 text-sidebar-background" />
              </div>
            )}
          </AdminLink>
        )}
      </div>

      {/* Toggle Button - desktop only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          'absolute top-4 -right-3 h-6 w-6 rounded-full bg-sidebar-accent border border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent z-50 hidden md:flex',
        )}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const itemPath = getPath(item.adminPath);
            const isActive = normalizedPath === item.adminPath ||
              (item.adminPath !== '/admin' && normalizedPath.startsWith(item.adminPath));

            return (
              <li key={item.adminPath}>
                <AdminLink
                  to={item.adminPath}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    collapsed && 'md:justify-center md:px-0',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn('font-medium', collapsed && 'md:hidden')}>{item.label}</span>
                </AdminLink>
              </li>
            );
          })}

          {/* Profile - Always Last */}
          <li>
            <AdminLink
              to={profileItem.adminPath}
              onClick={onMobileClose}
              title={collapsed ? profileItem.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                collapsed && 'md:justify-center md:px-0',
                isProfileActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <profileItem.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn('font-medium', collapsed && 'md:hidden')}>{profileItem.label}</span>
            </AdminLink>
          </li>
        </ul>
      </nav>

      {/* Support & Logout */}
      <div className="border-t border-sidebar-border p-4 space-y-1">
        <a
          href={SUPPORT_WHATSAPP ? `https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent('Olá, preciso de ajuda com o sistema')}` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'Suporte' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'md:justify-center md:px-0'
          )}
        >
          <Headphones className="h-5 w-5 flex-shrink-0" />
          <span className={cn('font-medium', collapsed && 'md:hidden')}>Suporte</span>
        </a>
        <Button
          variant="ghost"
          onClick={signOut}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent w-full',
            collapsed ? 'md:justify-center md:px-0 justify-start' : 'justify-start'
          )}
        >
          <LogOut className="h-5 w-5" />
          <span className={cn('ml-3', collapsed && 'md:hidden')}>Sair</span>
        </Button>
      </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
