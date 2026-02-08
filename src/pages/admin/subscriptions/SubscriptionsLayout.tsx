import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';
import { useIsMobile } from '@/hooks/use-mobile';
import { CreditCard, FileText, Package, ChevronDown, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubscriptionsLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: CreditCard, label: 'Pagamentos', adminPath: '/admin/assinaturas' },
  { icon: Package, label: 'Planos', adminPath: '/admin/assinaturas/planos' },
  { icon: FileText, label: 'Faturas', adminPath: '/admin/assinaturas/faturas' },
];

const SubscriptionsLayout = ({ children }: SubscriptionsLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { normalizeCurrentPath, getPath } = useAdminRoutes();
  const normalizedPath = normalizeCurrentPath(location.pathname);
  const isMobile = useIsMobile();

  const activeTab = menuItems.find(item => normalizedPath === item.adminPath)?.adminPath || menuItems[0].adminPath;

  const handleTabChange = (value: string) => {
    navigate(getPath(value));
  };

  const currentTab = menuItems.find(t => t.adminPath === activeTab);

  return (
    <AdminLayout>
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Desktop Tabs */}
          {!isMobile && (
            <TabsList className="h-auto p-1 bg-muted/50 w-full justify-center gap-1 rounded-lg border">
              {menuItems.map((item) => (
                <TabsTrigger
                  key={item.adminPath}
                  value={item.adminPath}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all",
                    "data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {/* Mobile Dropdown */}
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12 text-base"
                >
                  <span className="flex items-center gap-2">
                    {currentTab && (
                      <>
                        <currentTab.icon className="h-4 w-4" />
                        {currentTab.label}
                      </>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-3rem)]" align="start">
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.adminPath}
                    onClick={() => handleTabChange(item.adminPath)}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {activeTab === item.adminPath && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Tabs>

        {/* Content */}
        <div className="mt-6">
          {children}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubscriptionsLayout;
