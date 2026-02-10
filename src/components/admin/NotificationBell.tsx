import { useState } from 'react';
import { Bell, Check, CheckCheck, UserPlus, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AdminLink from './AdminLink';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { navigateAdmin } = useAdminNavigation();

  const getNotificationRoute = (type: string): string | null => {
    switch (type) {
      case 'overdue_invoice':
        return '/admin/assinaturas/faturas';
      case 'new_registration':
        return '/admin/usuarios';
      case 'new_lead':
        return '/admin/mensagens';
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_registration':
        return <UserPlus className="h-4 w-4 text-foreground/70" />;
      case 'new_lead':
        return <MessageSquare className="h-4 w-4 text-foreground/70" />;
      case 'overdue_invoice':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 hover:bg-muted/50 transition-colors cursor-pointer',
                    !notification.read && 'bg-muted/50'
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    const route = getNotificationRoute(notification.type);
                    if (route) {
                      setOpen(false);
                      navigateAdmin(route);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <AdminLink
              to="/admin/usuarios"
              className="block w-full text-center text-xs text-foreground/70 hover:underline py-1"
              onClick={() => setOpen(false)}
            >
              Ver usuários pendentes
            </AdminLink>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
