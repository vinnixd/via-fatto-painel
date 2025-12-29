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
import { Bell, ExternalLink, Settings, User, LogOut, ChevronDown, ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { useAdminBreadcrumbs } from '@/hooks/useAdminBreadcrumbs';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { role } = usePermissions();
  const breadcrumbs = useAdminBreadcrumbs();

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
    <header className="bg-card border-b border-border px-6 py-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm mb-2" aria-label="Breadcrumb">
        <Link
          to="/admin"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Dashboard"
        >
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((item, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
            {item.href ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Site
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
                  <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
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
