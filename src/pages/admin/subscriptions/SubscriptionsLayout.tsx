import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { CreditCard, FileText, Package, ChevronLeft } from 'lucide-react';

interface SubscriptionsLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: CreditCard, label: 'Pagamentos', path: '/admin/assinaturas' },
  { icon: Package, label: 'Planos', path: '/admin/assinaturas/planos' },
  { icon: FileText, label: 'Faturas', path: '/admin/assinaturas/faturas' },
];

const SubscriptionsLayout = ({ children }: SubscriptionsLayoutProps) => {
  const location = useLocation();

  return (
    <AdminLayout>
      {/* Mobile Menu */}
      <div className="lg:hidden border-b border-border bg-background p-4">
        <Link 
          to="/admin" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="font-medium">Assinaturas</span>
        </Link>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Submenu Sidebar */}
        <div className="w-64 border-r border-border bg-background p-4 hidden lg:block">
          <Link 
            to="/admin" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="font-medium">Assinaturas</span>
          </Link>
          
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubscriptionsLayout;
