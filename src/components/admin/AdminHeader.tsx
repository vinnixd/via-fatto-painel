import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, ExternalLink, Settings, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileSidebar?: () => void;
}

const AdminHeader = ({ title, subtitle, onOpenMobileSidebar }: AdminHeaderProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { role } = usePermissions();
  const unreadCount = useUnreadCount();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'gestor':
        return 'Gestor';
      case 'marketing':
        return 'Marketing';
      case 'corretor':
        return 'Corretor';
      default:
        return 'Usuário';
    }
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'AD';
  };

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
      {/* Title and Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2 h-9 w-9 shrink-0"
            onClick={onOpenMobileSidebar}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link to="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Site
            </Link>
          </Button>

          <ThemeToggle />

          <NotificationBell />

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/admin/mensagens">
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-foreground text-background text-sm">
                    {getInitials(profile?.name, profile?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">{displayName}</span>
                  <span className="text-xs text-muted-foreground leading-none mt-0.5">{getRoleLabel(role)}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ''} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-foreground text-background">
                    {getInitials(profile?.name, profile?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="font-medium text-sm">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{profile?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/perfil" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/configuracoes" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
