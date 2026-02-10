import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  Globe, 
  Plug, 
  GlobeLock,
  ChevronDown,
  Check,
  Search,
  ShieldCheck
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import tab content components
import DesignerContent from './admin-tabs/DesignerContent';
import PortaisContent from './admin-tabs/PortaisContent';
import IntegracoesContent from './admin-tabs/IntegracoesContent';

import DominiosContent from './admin-tabs/DominiosContent';
import SeoContent from './admin-tabs/SeoContent';
import CargosPermissoesContent from './admin-tabs/CargosPermissoesContent';

import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { id: 'designer', label: 'Designer', icon: Palette, roles: ['admin', 'gestor', 'marketing'] },
  { id: 'portais', label: 'Portais', icon: Globe, roles: ['admin', 'gestor', 'marketing'] },
  { id: 'integracoes', label: 'Integrações', icon: Plug, roles: ['admin', 'marketing'] },
  { id: 'dominios', label: 'Domínios', icon: GlobeLock, tenantRoles: ['owner', 'admin'] },
  { id: 'seo', label: 'SEO', icon: Search, roles: ['admin', 'gestor', 'marketing'] },
  { id: 'permissoes', label: 'Cargos e Permissões', icon: ShieldCheck, roles: ['admin'] },
];

const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'designer';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { userRole: tenantUserRole, isOwnerOrAdmin: isTenantAdmin } = useTenant();
  const { isAdmin, isGestor, isMarketing, isCorretor } = useAuth();

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter((tab) => {
    // Check tenant-based roles first
    if (tab.tenantRoles) {
      if (!tenantUserRole) return false;
      if (!tab.tenantRoles.includes(tenantUserRole)) return false;
    }
    
    // Check legacy roles
    if (!tab.roles) return true;
    if (isAdmin && tab.roles.includes('admin')) return true;
    if (isGestor && tab.roles.includes('gestor')) return true;
    if (isMarketing && tab.roles.includes('marketing')) return true;
    if (isCorretor && tab.roles.includes('corretor')) return true;
    return false;
  });

  // Sync tab state with URL
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  const isMobile = useIsMobile();

  return (
    <AdminLayout>
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Desktop Tabs */}
          {!isMobile && (
            <TabsList className="h-auto p-1 bg-muted/50 w-full justify-center gap-1 rounded-lg border">
              {visibleTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all",
                    "data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
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
                    {(() => {
                      const currentTab = visibleTabs.find(t => t.id === activeTab);
                      if (currentTab) {
                        const Icon = currentTab.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4" />
                            {currentTab.label}
                          </>
                        );
                      }
                      return 'Selecione';
                    })()}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-3rem)]" align="start">
                {visibleTabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <Check className="h-4 w-4 text-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Tab Contents */}
          <TabsContent value="designer" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <DesignerContent />
          </TabsContent>

          <TabsContent value="portais" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <PortaisContent />
          </TabsContent>

          <TabsContent value="integracoes" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <IntegracoesContent />
          </TabsContent>


          <TabsContent value="dominios" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <DominiosContent />
          </TabsContent>

          <TabsContent value="seo" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <SeoContent />
          </TabsContent>

          <TabsContent value="permissoes" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <CargosPermissoesContent />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPage;
