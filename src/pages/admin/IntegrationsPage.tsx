import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, CheckCircle2, XCircle, ExternalLink, BarChart3, Code, Megaphone } from 'lucide-react';

// Import official logos
import gtmLogo from '@/assets/integration-logos/google-tag-manager.jpg';
import gaLogo from '@/assets/integration-logos/google-analytics.png';
import metaLogo from '@/assets/integration-logos/meta-pixel.png';

interface IntegrationConfig {
  id: string;
  gtm_container_id: string;
  facebook_pixel_id: string;
  google_analytics_id: string;
}

// Validation patterns
const GTM_PATTERN = /^GTM-[A-Z0-9]{6,8}$/;
const FB_PIXEL_PATTERN = /^[0-9]{15,16}$/;
const GA_PATTERN = /^(G-[A-Z0-9]{10,12}|UA-[0-9]+-[0-9]+)$/;

const IntegrationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('id, gtm_container_id, facebook_pixel_id, google_analytics_id')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          gtm_container_id: data.gtm_container_id || '',
          facebook_pixel_id: data.facebook_pixel_id || '',
          google_analytics_id: data.google_analytics_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const validateGTM = (value: string): boolean => {
    if (!value) return true;
    return GTM_PATTERN.test(value);
  };

  const validateFBPixel = (value: string): boolean => {
    if (!value) return true;
    return FB_PIXEL_PATTERN.test(value);
  };

  const validateGA = (value: string): boolean => {
    if (!value) return true;
    return GA_PATTERN.test(value);
  };

  const handleChange = (field: keyof IntegrationConfig, value: string) => {
    if (!config) return;
    
    const cleanValue = value.trim().toUpperCase();
    setConfig({ ...config, [field]: field === 'facebook_pixel_id' ? value.trim() : cleanValue });

    const newErrors = { ...errors };
    
    if (field === 'gtm_container_id') {
      if (cleanValue && !validateGTM(cleanValue)) {
        newErrors.gtm = 'Formato inválido. Ex: GTM-XXXXXXX';
      } else {
        delete newErrors.gtm;
      }
    }
    
    if (field === 'facebook_pixel_id') {
      if (value.trim() && !validateFBPixel(value.trim())) {
        newErrors.fb = 'Formato inválido. Deve ter 15-16 dígitos';
      } else {
        delete newErrors.fb;
      }
    }
    
    if (field === 'google_analytics_id') {
      if (cleanValue && !validateGA(cleanValue)) {
        newErrors.ga = 'Formato inválido. Ex: G-XXXXXXXXXX ou UA-XXXXX-X';
      } else {
        delete newErrors.ga;
      }
    }
    
    setErrors(newErrors);
  };

  const handleSave = async () => {
    if (!config) return;
    
    const newErrors: Record<string, string> = {};
    
    if (config.gtm_container_id && !validateGTM(config.gtm_container_id)) {
      newErrors.gtm = 'Formato inválido';
    }
    if (config.facebook_pixel_id && !validateFBPixel(config.facebook_pixel_id)) {
      newErrors.fb = 'Formato inválido';
    }
    if (config.google_analytics_id && !validateGA(config.google_analytics_id)) {
      newErrors.ga = 'Formato inválido';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Corrija os erros antes de salvar');
      return;
    }
    
    setSaving(true);

    try {
      const { error } = await supabase
        .from('site_config')
        .update({
          gtm_container_id: config.gtm_container_id || '',
          facebook_pixel_id: config.facebook_pixel_id || '',
          google_analytics_id: config.google_analytics_id || '',
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success('Integrações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando integrações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!config) return null;

  const integrations = [
    {
      id: 'gtm',
      title: 'Google Tag Manager',
      description: 'Gerencie todas as suas tags de marketing em um só lugar. Adicione scripts, pixels e tags sem precisar editar o código.',
      field: 'gtm_container_id' as keyof IntegrationConfig,
      value: config.gtm_container_id,
      placeholder: 'GTM-XXXXXXX',
      helpText: 'ID do contêiner do GTM (ex: GTM-ABC123D)',
      docsUrl: 'https://tagmanager.google.com/',
      logo: gtmLogo,
      category: 'analytics',
    },
    {
      id: 'ga',
      title: 'Google Analytics',
      description: 'Analise o tráfego e comportamento dos visitantes do seu site com métricas detalhadas e relatórios em tempo real.',
      field: 'google_analytics_id' as keyof IntegrationConfig,
      value: config.google_analytics_id,
      placeholder: 'G-XXXXXXXXXX',
      helpText: 'ID de medição GA4 (ex: G-ABC123XYZ) ou Universal (UA-XXXXX-X)',
      docsUrl: 'https://analytics.google.com/',
      logo: gaLogo,
      category: 'analytics',
    },
    {
      id: 'fb',
      title: 'Meta Pixel',
      description: 'Acompanhe conversões, crie públicos personalizados e otimize seus anúncios no Facebook e Instagram.',
      field: 'facebook_pixel_id' as keyof IntegrationConfig,
      value: config.facebook_pixel_id,
      placeholder: '1234567890123456',
      helpText: 'ID do Pixel (15-16 dígitos numéricos)',
      docsUrl: 'https://business.facebook.com/events_manager',
      logo: metaLogo,
      category: 'marketing',
    },
  ];

  const activeCount = integrations.filter(i => !!i.value && !errors[i.id]).length;

  const tabItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Google Analytics e GTM' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Pixels e conversões' },
  ];

  const renderIntegrationCard = (integration: typeof integrations[0]) => {
    const hasValue = !!integration.value;
    const hasError = !!errors[integration.id];
    const isValid = hasValue && !hasError;

    return (
      <Card key={integration.id} className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-border flex items-center justify-center p-2 shrink-0 shadow-sm">
              <img 
                src={integration.logo} 
                alt={integration.title} 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{integration.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {isValid && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  )}
                  {hasError && (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inválido
                    </Badge>
                  )}
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Abrir documentação"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <CardDescription className="mt-1">{integration.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Label htmlFor={integration.id} className="text-sm font-medium">
              ID da Integração
            </Label>
            <div className="relative">
              <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={integration.id}
                value={integration.value}
                onChange={(e) => handleChange(integration.field, e.target.value)}
                placeholder={integration.placeholder}
                className={`pl-10 font-mono text-sm ${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
            </div>
            {hasError ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {errors[integration.id]}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{integration.helpText}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Integrações Ativas</p>
                <p className="font-semibold text-lg">{activeCount} de {integrations.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Analytics</p>
                <p className="font-semibold">{config.google_analytics_id ? 'Configurado' : 'Pendente'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marketing</p>
                <p className="font-semibold">{config.facebook_pixel_id ? 'Configurado' : 'Pendente'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="hidden lg:block w-64 space-y-2">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-card hover:bg-muted border border-border'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{tab.label}</p>
                  <p className={`text-xs ${activeTab === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            ))}

            <div className="pt-4">
              <Button variant="admin" onClick={handleSave} disabled={saving || Object.keys(errors).length > 0} className="w-full" size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full h-auto gap-1 bg-muted/50 p-1">
                {tabItems.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
                    <tab.icon className="h-4 w-4 mr-1" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                {integrations
                  .filter(i => i.category === 'analytics')
                  .map(renderIntegrationCard)}
              </div>
            )}

            {activeTab === 'marketing' && (
              <div className="space-y-6 animate-fade-in">
                {integrations
                  .filter(i => i.category === 'marketing')
                  .map(renderIntegrationCard)}
              </div>
            )}

            {/* Mobile Save Button */}
            <div className="lg:hidden">
              <Button variant="admin" onClick={handleSave} disabled={saving || Object.keys(errors).length > 0} className="w-full" size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IntegrationsPage;