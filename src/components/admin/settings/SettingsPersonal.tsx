import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import { 
  Building2, 
  Sun, 
  Moon, 
  Monitor, 
  CreditCard, 
  FileText, 
  Users2,
  Key,
  Smartphone,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SettingsPersonal = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { data: siteConfig, refetch } = useSiteConfig();
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoUpload = async (file: File) => {
    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('site_config')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', siteConfig?.id);

      if (updateError) throw updateError;

      refetch();
      toast({ title: 'Logo atualizado com sucesso!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({ title: 'Erro ao atualizar logo', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const themeOptions = [
    { id: 'light', label: 'Claro', description: 'Tema claro padrão', icon: Sun },
    { id: 'dark', label: 'Escuro', description: 'Tema escuro para reduzir fadiga visual', icon: Moon },
    { id: 'system', label: 'Sistema', description: 'Seguir configuração do sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Logo do Escritório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Logo do Escritório
          </CardTitle>
          <CardDescription>
            Personalize a identidade visual do seu escritório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {siteConfig?.logo_url ? (
                <img 
                  src={siteConfig.logo_url} 
                  alt="Logo" 
                  className="h-16 w-16 object-contain rounded-lg border border-border"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{siteConfig?.seo_title || 'Sua Imobiliária'}</p>
              <div className="mt-2">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={saving}>
                    <span>
                      <Building2 className="h-4 w-4 mr-2" />
                      {saving ? 'Enviando...' : 'Adicionar logo'}
                    </span>
                  </Button>
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG ou WEBP. Max. 5MB. Recomendado: 200x200px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id as 'light' | 'dark' | 'system')}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 bg-card'
                  )}
                >
                  <div className={cn(
                    'p-3 rounded-full',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notificações - Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Pagamentos
          </CardTitle>
          <CardDescription>
            Alertas relacionados a pagamentos e finanças
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Pagamentos em atraso</p>
                <p className="text-sm text-muted-foreground">Receber alerta quando um pagamento estiver vencido</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Pagamentos próximos</p>
                <p className="text-sm text-muted-foreground">Receber alerta quando um pagamento estiver próximo do vencimento</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notificações - Contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contratos
          </CardTitle>
          <CardDescription>
            Alertas relacionados a contratos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Contratos expirando</p>
                <p className="text-sm text-muted-foreground">Receber alerta quando um contrato estiver próximo do vencimento</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Contratos assinados</p>
                <p className="text-sm text-muted-foreground">Receber notificação quando um contrato for assinado</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notificações - Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            Leads
          </CardTitle>
          <CardDescription>
            Alertas relacionados a leads e clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Users2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Follow-up pendente</p>
                <p className="text-sm text-muted-foreground">Receber alerta quando um lead precisar de follow-up</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Users2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Novos leads</p>
                <p className="text-sm text-muted-foreground">Receber notificação quando um novo lead for cadastrado</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Instalar Aplicativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Instalar Aplicativo
          </CardTitle>
          <CardDescription>
            Instale o sistema no seu celular para acesso rápido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Zatch System</p>
                <p className="text-sm text-muted-foreground">App Instalável (PWA)</p>
              </div>
            </div>
            <div className="flex-1">
              <Button className="w-full md:w-auto">
                <Smartphone className="h-4 w-4 mr-2" />
                Ver instruções de Instalação
              </Button>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm text-foreground">Vantagens do App</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Acesso rápido pela tela inicial
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Funciona em tela cheia
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Carregamento mais rápido
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Funciona offline
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPersonal;
