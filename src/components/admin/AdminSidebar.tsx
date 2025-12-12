import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Palette,
  Building2,
  FolderOpen,
  Settings,
  Globe,
  Heart,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Palette, label: 'Designer', path: '/admin/designer' },
  { icon: Building2, label: 'Imóveis', path: '/admin/imoveis' },
  { icon: FolderOpen, label: 'Categorias', path: '/admin/categorias' },
  { icon: Globe, label: 'Configurações', path: '/admin/configuracoes' },
  { icon: Heart, label: 'Favoritos', path: '/admin/favoritos' },
  { icon: MessageSquare, label: 'Mensagens', path: '/admin/mensagens' },
  { icon: User, label: 'Meu Perfil', path: '/admin/perfil' },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-neutral-900 text-neutral-100 transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Imobiliária</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/admin" className="mx-auto">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          'absolute top-4 -right-3 h-6 w-6 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700 z-50',
        )}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="border-t border-neutral-800 p-4">
        {!collapsed && (
          <div className="mb-3 text-sm text-neutral-400 truncate">
            {user?.email}
          </div>
        )}
        <Button
          variant="ghost"
          onClick={signOut}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800',
            collapsed ? 'w-full justify-center px-0' : 'w-full justify-start'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
