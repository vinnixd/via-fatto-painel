import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage, resizeFavicon } from '@/lib/imageCompression';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Palette, 
  Image, 
  FileText, 
  Upload, 
  Eye, 
  Save, 
  Globe,
  Phone,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ImagePlus,
  Layout,
  Share2,
  Sparkles,
  Droplets,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImagePositionPicker } from '@/components/ui/ImagePositionPicker';
import { useTenant } from '@/contexts/TenantContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface SiteConfig {
  id: string;
  logo_url: string;
  logo_horizontal_url: string;
  logo_vertical_url: string;
  logo_symbol_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_url: string;
  about_title: string;
  about_text: string;
  about_image_url: string;
  about_image_position: 'top' | 'center' | 'bottom';
  home_image_url: string;
  home_image_position: string;
  footer_text: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  social_facebook: string;
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  watermark_url: string;
  watermark_enabled: boolean;
  watermark_opacity: number;
  watermark_size: number;
}

const tabItems = [
  { id: 'brand', label: 'Marca', icon: Sparkles, description: 'Logo, cores e favicon' },
  { id: 'hero', label: 'Hero', icon: Layout, description: 'Seção principal' },
  { id: 'about', label: 'Sobre', icon: FileText, description: 'Página institucional' },
  { id: 'contact', label: 'Contato', icon: Phone, description: 'Informações de contato' },
  { id: 'social', label: 'Redes', icon: Share2, description: 'Mídias sociais' },
  { id: 'watermark', label: 'Marca d\'água', icon: Droplets, description: 'Proteção de imagens' },
];

const DesignerContent = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [activeTab, setActiveTab] = useState('brand');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (tenantId) {
      fetchConfig();
    }
  }, [tenantId]);

  const fetchConfig = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as SiteConfig);
      } else {
        const { data: newConfig, error: insertError } = await supabase
          .from('site_config')
          .upsert({ tenant_id: tenantId }, { onConflict: 'tenant_id' })
          .select()
          .single();

        if (insertError) throw insertError;
        setConfig(newConfig as SiteConfig);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, field: keyof SiteConfig) => {
    try {
      let fileToUpload: File;
      
      if (field === 'watermark_url' && (file.type === 'image/png' || file.type === 'image/svg+xml')) {
        fileToUpload = file;
      } else {
        fileToUpload = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 });
      }
      
      const fileExt = fileToUpload.name.split('.').pop() || (file.type === 'image/png' ? 'png' : 'jpg');
      const fileName = `${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, fileToUpload, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setConfig(prev => prev ? { ...prev, [field]: urlData.publicUrl } : null);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    }
  };

  const handleFaviconUpload = async (file: File) => {
    try {
      const resizedFile = await resizeFavicon(file, 64);
      
      const fileExt = resizedFile.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, resizedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setConfig(prev => prev ? { ...prev, favicon_url: urlData.publicUrl } : null);
      toast.success('Favicon enviado com sucesso!');
    } catch (error) {
      console.error('Favicon upload error:', error);
      toast.error('Erro ao enviar favicon');
    }
  };

  const handleSave = async () => {
    if (!config || !tenantId) {
      toast.error('Erro: configuração ou tenant não disponível');
      return;
    }
    setSaving(true);

    try {
      const updateData = {
        tenant_id: tenantId,
        logo_url: config.logo_url,
        logo_horizontal_url: config.logo_horizontal_url,
        logo_vertical_url: config.logo_vertical_url,
        logo_symbol_url: config.logo_symbol_url,
        favicon_url: config.favicon_url,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        accent_color: config.accent_color,
        hero_title: config.hero_title,
        hero_subtitle: config.hero_subtitle,
        hero_background_url: config.hero_background_url,
        about_title: config.about_title,
        about_text: config.about_text,
        about_image_url: config.about_image_url,
        about_image_position: config.about_image_position,
        home_image_url: config.home_image_url,
        home_image_position: config.home_image_position,
        footer_text: config.footer_text,
        phone: config.phone,
        email: config.email,
        whatsapp: config.whatsapp,
        address: config.address,
        social_facebook: config.social_facebook,
        social_instagram: config.social_instagram,
        social_linkedin: config.social_linkedin,
        social_youtube: config.social_youtube,
        seo_title: config.seo_title,
        seo_description: config.seo_description,
        seo_keywords: config.seo_keywords,
        watermark_url: config.watermark_url,
        watermark_enabled: config.watermark_enabled,
        watermark_opacity: config.watermark_opacity,
        watermark_size: config.watermark_size,
      };

      const { error } = await supabase
        .from('site_config')
        .upsert(updateData, { onConflict: 'tenant_id' })
        .select('id, tenant_id, hero_title, updated_at')
        .single();

      if (error) throw error;
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion stats
  const getCompletionStats = () => {
    if (!config) return { colors: 0, images: 0, social: 0 };
    
    const colors = [config.primary_color, config.secondary_color, config.accent_color].filter(Boolean).length;
    const images = [config.logo_horizontal_url, config.logo_vertical_url, config.logo_symbol_url, config.hero_background_url, config.about_image_url].filter(Boolean).length;
    const social = [config.social_facebook, config.social_instagram, config.social_linkedin, config.social_youtube].filter(Boolean).length;
    
    return { colors, images, social };
  };

  const stats = getCompletionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="relative">
      {/* Stats Bar - Compact and modern */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Palette className="h-4 w-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Cores</p>
            <p className="font-semibold text-sm">{stats.colors}/3</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Image className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Imagens</p>
            <p className="font-semibold text-sm">{stats.images}/5</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Share2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Redes</p>
            <p className="font-semibold text-sm">{stats.social}/4</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation - Desktop */}
        <nav className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6 space-y-1">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-background"
                  )}>
                    <tab.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tab.label}</p>
                    <p className={cn(
                      "text-xs truncate transition-colors",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {tab.description}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button 
                variant="admin" 
                onClick={handleSave} 
                disabled={saving} 
                className="w-full justify-center"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/" target="_blank">
                  <Eye className="h-4 w-4" />
                  Ver site
                </Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Tab Navigation */}
        {isMobile && (
          <div className="lg:hidden">
            <ScrollArea className="w-full">
              <div className="flex gap-1 pb-2">
                {tabItems.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Brand Tab */}
          {activeTab === 'brand' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Logos Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                      <ImagePlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Logotipos</CardTitle>
                      <CardDescription>Diferentes versões do seu logo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Logo Horizontal */}
                    <LogoUploadCard
                      label="Horizontal"
                      hint="Cabeçalhos"
                      imageUrl={config.logo_horizontal_url}
                      inputId="logo-horizontal-upload"
                      onUpload={(file) => handleImageUpload(file, 'logo_horizontal_url')}
                      aspectRatio="wide"
                    />
                    
                    {/* Logo Vertical */}
                    <LogoUploadCard
                      label="Vertical"
                      hint="Quadrado"
                      imageUrl={config.logo_vertical_url}
                      inputId="logo-vertical-upload"
                      onUpload={(file) => handleImageUpload(file, 'logo_vertical_url')}
                      aspectRatio="square"
                    />
                    
                    {/* Logo Symbol */}
                    <LogoUploadCard
                      label="Símbolo"
                      hint="Ícone"
                      imageUrl={config.logo_symbol_url}
                      inputId="logo-symbol-upload"
                      onUpload={(file) => handleImageUpload(file, 'logo_symbol_url')}
                      aspectRatio="square"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Favicon Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-xl">
                      <Globe className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Favicon</CardTitle>
                      <CardDescription>Ícone exibido na aba do navegador</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
                      config.favicon_url ? "border-border bg-muted" : "border-muted-foreground/30 bg-muted/50"
                    )}>
                      {config.favicon_url ? (
                        <img src={config.favicon_url} alt="Favicon" className="w-8 h-8 object-contain" />
                      ) : (
                        <Globe className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">PNG ou ICO, 64x64 recomendado</p>
                      <Label htmlFor="favicon-upload" className="cursor-pointer inline-block">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                          <Upload className="h-4 w-4" />
                          {config.favicon_url ? 'Alterar' : 'Enviar'}
                        </div>
                        <Input
                          id="favicon-upload"
                          type="file"
                          accept="image/png,image/x-icon,image/ico"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFaviconUpload(file);
                          }}
                        />
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Colors Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500/20 to-violet-500/10 rounded-xl">
                      <Palette className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Cores da Marca</CardTitle>
                      <CardDescription>Defina a paleta de cores do site</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ColorPicker
                      label="Primária"
                      value={config.primary_color || '#000000'}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, primary_color: value } : null)}
                    />
                    <ColorPicker
                      label="Secundária"
                      value={config.secondary_color || '#666666'}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, secondary_color: value } : null)}
                    />
                    <ColorPicker
                      label="Destaque"
                      value={config.accent_color || '#0066FF'}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, accent_color: value } : null)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hero Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl">
                      <Layout className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Seção Principal</CardTitle>
                      <CardDescription>Banner principal do site</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título Principal</Label>
                    <Input
                      value={config.hero_title || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, hero_title: e.target.value } : null)}
                      placeholder="Encontre o imóvel dos seus sonhos"
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Textarea
                      value={config.hero_subtitle || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, hero_subtitle: e.target.value } : null)}
                      placeholder="As melhores opções de imóveis para você"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagem de Fundo</Label>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {config.hero_background_url ? (
                        <img src={config.hero_background_url} alt="Hero" className="w-full sm:w-48 h-28 object-cover rounded-xl border" />
                      ) : (
                        <div className="w-full sm:w-48 h-28 rounded-xl border-2 border-dashed bg-muted/50 flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-3">Recomendado: 1920x1080px, formato 16:9</p>
                        <Label htmlFor="hero-upload" className="cursor-pointer inline-block">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                            <Upload className="h-4 w-4" />
                            {config.hero_background_url ? 'Alterar Imagem' : 'Enviar Imagem'}
                          </div>
                          <Input
                            id="hero-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'hero_background_url');
                            }}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Home Image Position */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Posição da Imagem</CardTitle>
                  <CardDescription>Ajuste o ponto focal da imagem de fundo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImagePositionPicker
                    position={config.home_image_position || '50% 50%'}
                    onChange={(position) => setConfig(prev => prev ? { ...prev, home_image_position: position } : null)}
                    imageUrl={config.hero_background_url || ''}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-xl">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Página Sobre</CardTitle>
                      <CardDescription>Informações sobre sua empresa</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.about_title || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, about_title: e.target.value } : null)}
                      placeholder="Sobre Nós"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Texto Institucional</Label>
                    <Textarea
                      value={config.about_text || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, about_text: e.target.value } : null)}
                      placeholder="Conte a história da sua empresa, missão, visão e valores..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagem</Label>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {config.about_image_url ? (
                        <img src={config.about_image_url} alt="Sobre" className="w-full sm:w-40 h-28 object-cover rounded-xl border" />
                      ) : (
                        <div className="w-full sm:w-40 h-28 rounded-xl border-2 border-dashed bg-muted/50 flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <Label htmlFor="about-upload" className="cursor-pointer inline-block">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                            <Upload className="h-4 w-4" />
                            {config.about_image_url ? 'Alterar' : 'Enviar'}
                          </div>
                          <Input
                            id="about-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'about_image_url');
                            }}
                          />
                        </Label>
                        {config.about_image_url && (
                          <div className="space-y-2">
                            <Label className="text-xs">Posição da imagem</Label>
                            <ImagePositionPicker
                              position={config.about_image_position === 'top' ? '50% 0%' : config.about_image_position === 'bottom' ? '50% 100%' : '50% 50%'}
                              onChange={(position) => {
                                const y = parseInt(position.split(' ')[1]) || 50;
                                const pos = y < 33 ? 'top' : y > 66 ? 'bottom' : 'center';
                                setConfig(prev => prev ? { ...prev, about_image_position: pos as 'top' | 'center' | 'bottom' } : null);
                              }}
                              imageUrl={config.about_image_url}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-rose-500/20 to-rose-500/10 rounded-xl">
                      <Phone className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Informações de Contato</CardTitle>
                      <CardDescription>Dados exibidos no site e rodapé</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={config.phone || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input
                        value={config.whatsapp || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, whatsapp: e.target.value } : null)}
                        placeholder="5511999999999"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={config.email || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, email: e.target.value } : null)}
                        placeholder="contato@empresa.com.br"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Endereço</Label>
                      <Textarea
                        value={config.address || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, address: e.target.value } : null)}
                        placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Texto do Rodapé</Label>
                      <Input
                        value={config.footer_text || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, footer_text: e.target.value } : null)}
                        placeholder="© 2024 Sua Empresa. Todos os direitos reservados."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl">
                      <Share2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Redes Sociais</CardTitle>
                      <CardDescription>Links para seus perfis nas redes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SocialInput
                      icon={Facebook}
                      label="Facebook"
                      value={config.social_facebook || ''}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, social_facebook: value } : null)}
                      placeholder="https://facebook.com/suaempresa"
                      color="text-blue-600"
                    />
                    <SocialInput
                      icon={Instagram}
                      label="Instagram"
                      value={config.social_instagram || ''}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, social_instagram: value } : null)}
                      placeholder="https://instagram.com/suaempresa"
                      color="text-pink-600"
                    />
                    <SocialInput
                      icon={Linkedin}
                      label="LinkedIn"
                      value={config.social_linkedin || ''}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, social_linkedin: value } : null)}
                      placeholder="https://linkedin.com/company/suaempresa"
                      color="text-blue-700"
                    />
                    <SocialInput
                      icon={Youtube}
                      label="YouTube"
                      value={config.social_youtube || ''}
                      onChange={(value) => setConfig(prev => prev ? { ...prev, social_youtube: value } : null)}
                      placeholder="https://youtube.com/@suaempresa"
                      color="text-red-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


          {/* Watermark Tab */}
          {activeTab === 'watermark' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 rounded-xl">
                      <Droplets className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Marca d'água</CardTitle>
                      <CardDescription>Proteja suas imagens de imóveis</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-base">Ativar marca d'água</Label>
                      <p className="text-sm text-muted-foreground">Aplicar em todas as fotos de imóveis</p>
                    </div>
                    <Switch
                      checked={config.watermark_enabled || false}
                      onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, watermark_enabled: checked } : null)}
                    />
                  </div>

                  {config.watermark_enabled && (
                    <>
                      <div className="space-y-4">
                        <Label>Imagem da Marca d'água</Label>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          <div className={cn(
                            "w-32 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
                            config.watermark_url ? "border-border bg-muted" : "border-muted-foreground/30 bg-muted/50"
                          )}>
                            {config.watermark_url ? (
                              <img src={config.watermark_url} alt="Watermark" className="max-w-full max-h-full object-contain p-2" />
                            ) : (
                              <Droplets className="h-6 w-6 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">PNG com transparência recomendado</p>
                            <Label htmlFor="watermark-upload" className="cursor-pointer inline-block">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                                <Upload className="h-4 w-4" />
                                {config.watermark_url ? 'Alterar' : 'Enviar'}
                              </div>
                              <Input
                                id="watermark-upload"
                                type="file"
                                accept="image/png,image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'watermark_url');
                                }}
                              />
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Opacidade</Label>
                          <span className="text-sm text-muted-foreground">{config.watermark_opacity || 50}%</span>
                        </div>
                        <Slider
                          value={[config.watermark_opacity || 50]}
                          onValueChange={([value]) => setConfig(prev => prev ? { ...prev, watermark_opacity: value } : null)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Tamanho</Label>
                          <span className="text-sm text-muted-foreground">{config.watermark_size || 20}%</span>
                        </div>
                        <Slider
                          value={[config.watermark_size || 20]}
                          onValueChange={([value]) => setConfig(prev => prev ? { ...prev, watermark_size: value } : null)}
                          max={50}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-40">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/" target="_blank">
                <Eye className="h-4 w-4" />
                Ver site
              </Link>
            </Button>
            <Button 
              variant="admin" 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Add padding at bottom for mobile FAB */}
      {isMobile && <div className="h-20" />}
    </div>
  );
};

// Helper Components

interface LogoUploadCardProps {
  label: string;
  hint: string;
  imageUrl: string;
  inputId: string;
  onUpload: (file: File) => void;
  aspectRatio: 'wide' | 'square';
}

const LogoUploadCard = ({ label, hint, imageUrl, inputId, onUpload, aspectRatio }: LogoUploadCardProps) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="outline" className="text-xs">{label}</Badge>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
    <div className="relative group">
      <div className={cn(
        "rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-200",
        aspectRatio === 'wide' ? 'h-20' : 'h-20',
        imageUrl 
          ? "border-border bg-muted hover:border-primary" 
          : "border-muted-foreground/30 bg-muted/50"
      )}>
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="max-w-full max-h-full object-contain p-3" />
        ) : (
          <div className="text-center">
            <div className={cn(
              "border-2 border-dashed border-muted-foreground/30 rounded mx-auto mb-1",
              aspectRatio === 'wide' ? 'w-12 h-6' : 'w-8 h-8'
            )} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        )}
      </div>
    </div>
    <Label htmlFor={inputId} className="cursor-pointer mt-2">
      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium">
        <Upload className="h-3.5 w-3.5" />
        {imageUrl ? 'Alterar' : 'Enviar'}
      </div>
      <Input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </Label>
  </div>
);

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => (
  <div className="space-y-2">
    <Label className="text-sm">{label}</Label>
    <div className="flex items-center gap-2">
      <div className="relative">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 p-1 cursor-pointer rounded-xl border-2"
        />
        <div 
          className="absolute inset-1 rounded-lg pointer-events-none"
          style={{ backgroundColor: value }}
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 font-mono text-sm uppercase"
        maxLength={7}
      />
    </div>
  </div>
);

interface SocialInputProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  color: string;
}

const SocialInput = ({ icon: Icon, label, value, onChange, placeholder, color }: SocialInputProps) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", color)} />
      {label}
    </Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default DesignerContent;
