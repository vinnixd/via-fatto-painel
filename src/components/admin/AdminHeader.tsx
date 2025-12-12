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
import { Bell, ExternalLink, Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();

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
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
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
                <span className="text-xs text-muted-foreground leading-none mt-0.5">Administrador</span>
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
    </header>
  );
};

export default AdminHeader;
