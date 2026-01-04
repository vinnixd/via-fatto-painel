import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminFooter from '@/components/admin/AdminFooter';
import { cn } from '@/lib/utils';
import { 
  User, 
  Crown, 
  Percent, 
  DollarSign, 
  Bell, 
  Settings, 
  Rss, 
  Globe, 
  Shield 
} from 'lucide-react';

// Tab components
import SettingsPersonal from '@/components/admin/settings/SettingsPersonal';
import SettingsSubscription from '@/components/admin/settings/SettingsSubscription';
import SettingsCommissions from '@/components/admin/settings/SettingsCommissions';
import SettingsFinancial from '@/components/admin/settings/SettingsFinancial';
import SettingsAlerts from '@/components/admin/settings/SettingsAlerts';
import SettingsDefaults from '@/components/admin/settings/SettingsDefaults';
import SettingsPortals from '@/components/admin/settings/SettingsPortals';
import SettingsStorefront from '@/components/admin/settings/SettingsStorefront';
import SettingsPermissions from '@/components/admin/settings/SettingsPermissions';

const tabs = [
  { id: 'pessoal', label: 'Pessoal', icon: User },
  { id: 'assinatura', label: 'Assinatura', icon: Crown },
  { id: 'comissoes', label: 'Comissões', icon: Percent },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'padroes', label: 'Padrões', icon: Settings },
  { id: 'portais', label: 'Portais', icon: Rss },
  { id: 'vitrine', label: 'Vitrine', icon: Globe },
  { id: 'permissoes', label: 'Permissões', icon: Shield },
];

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'pessoal';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pessoal':
        return <SettingsPersonal />;
      case 'assinatura':
        return <SettingsSubscription />;
      case 'comissoes':
        return <SettingsCommissions />;
      case 'financeiro':
        return <SettingsFinancial />;
      case 'alertas':
        return <SettingsAlerts />;
      case 'padroes':
        return <SettingsDefaults />;
      case 'portais':
        return <SettingsPortals />;
      case 'vitrine':
        return <SettingsStorefront />;
      case 'permissoes':
        return <SettingsPermissions />;
      default:
        return <SettingsPersonal />;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          {/* Header */}
          <div className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">Preferências e ajustes do sistema</p>
            </div>

            {/* Tabs Navigation */}
            <div className="px-6">
              <nav className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        <AdminFooter />
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
