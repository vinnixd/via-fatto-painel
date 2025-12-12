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
  Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Palette, label: 'Designer', path: '/admin/designer' },
  { icon: Building2, label: 'Imóveis', path: '/admin/imoveis' },
  { icon: Upload, label: 'Importar CSV', path: '/admin/importar' },
  { icon: FolderOpen, label: 'Categorias', path: '/admin/categorias' },
  { icon: User, label: 'Meu Perfil', path: '/admin/perfil' },
  { icon: Globe, label: 'Configurações', path: '/admin/configuracoes' },
  { icon: Heart, label: 'Favoritos', path: '/admin/favoritos' },
  { icon: MessageSquare, label: 'Mensagens', path: '/admin/mensagens' },
];

const AdminSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

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
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
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
