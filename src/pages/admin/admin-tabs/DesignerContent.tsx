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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage, resizeFavicon } from '@/lib/imageCompression';
import { 
  Loader2, 
  Palette, 
  Image, 
  FileText, 
  Upload, 
  Eye, 
  Save, 
  RefreshCw,
  Globe,
  Globe2,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  CheckCircle2,
  ImagePlus,
  Type,
  Layout,
  Share2,
  Settings2,
  Sparkles,
  Plus,
  Link as LinkIcon,
  Calendar,
  Shield,
  Trash2,
  Star,
  CheckCircle,
  ExternalLink,
  Copy,
  Info,
  AlertCircle,
  Droplets,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImagePositionPicker } from '@/components/ui/ImagePositionPicker';
import { useTenant } from '@/contexts/TenantContext';

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

const DesignerContent = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [activeTab, setActiveTab] = useState('brand');

  useEffect(() => {
    if (tenantId) {
      fetchConfig();
    }
  }, [tenantId]);

  const fetchConfig = async () => {
    if (!tenantId) {
      console.warn('[DesignerContent] No tenant_id available');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  const tabItems = [
    { id: 'brand', label: 'Marca', icon: Sparkles, description: 'Logo e cores' },
    { id: 'hero', label: 'Hero', icon: Layout, description: 'Seção principal' },
    { id: 'about', label: 'Sobre', icon: FileText, description: 'Quem somos' },
    { id: 'contact', label: 'Contato', icon: Phone, description: 'Informações' },
    { id: 'social', label: 'Redes', icon: Share2, description: 'Mídias sociais' },
    { id: 'seo', label: 'SEO', icon: Globe, description: 'Otimização' },
  ];

  return (
    <div>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cores</p>
              <p className="font-semibold">3 definidas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Image className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Imagens</p>
              <p className="font-semibold">{[config.logo_horizontal_url, config.logo_vertical_url, config.logo_symbol_url, config.hero_background_url, config.about_image_url].filter(Boolean).length} enviadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Redes Sociais</p>
              <p className="font-semibold">{[config.social_facebook, config.social_instagram, config.social_linkedin, config.social_youtube].filter(Boolean).length} conectadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SEO</p>
              <p className="font-semibold">{config.seo_title ? 'Configurado' : 'Pendente'}</p>
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

          <Separator className="my-4" />

          <Button variant="admin" onClick={handleSave} disabled={saving} className="w-full" size="lg">
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

          <Button variant="outline" className="w-full" asChild>
            <Link to="/" target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Site
            </Link>
          </Button>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden w-full">
          <div className="flex flex-wrap gap-1 mb-6">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* Brand Tab */}
          {activeTab === 'brand' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ImagePlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Logotipos da Empresa</CardTitle>
                      <CardDescription>Envie diferentes versões do seu logotipo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Horizontal */}
                    <div className="flex flex-col h-full">
                      <div className="h-10 flex items-start gap-2 mb-3">
                        <Badge variant="outline" className="text-xs shrink-0">Horizontal</Badge>
                        <span className="text-xs text-muted-foreground">Para cabeçalhos</span>
                      </div>
                      <div className="relative group flex-1 mb-3">
                        {config.logo_horizontal_url ? (
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                            <img src={config.logo_horizontal_url} alt="Logo Horizontal" className="max-w-full max-h-full object-contain p-2" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                            <span className="text-xs text-muted-foreground">Horizontal</span>
                          </div>
                        )}
                      </div>
                      <Label htmlFor="logo-horizontal-upload" className="cursor-pointer block mt-auto">
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          {config.logo_horizontal_url ? 'Alterar' : 'Enviar'}
                        </div>
                        <Input
                          id="logo-horizontal-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'logo_horizontal_url');
                          }}
                        />
                      </Label>
                    </div>
                    
                    {/* Logo Vertical */}
                    <div className="flex flex-col h-full">
                      <div className="h-10 flex items-start gap-2 mb-3">
                        <Badge variant="outline" className="text-xs shrink-0">Vertical</Badge>
                        <span className="text-xs text-muted-foreground">Formato quadrado</span>
                      </div>
                      <div className="relative group flex-1 mb-3">
                        {config.logo_vertical_url ? (
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                            <img src={config.logo_vertical_url} alt="Logo Vertical" className="max-w-full max-h-full object-contain p-2" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                            <span className="text-xs text-muted-foreground">Vertical</span>
                          </div>
                        )}
                      </div>
                      <Label htmlFor="logo-vertical-upload" className="cursor-pointer block mt-auto">
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          {config.logo_vertical_url ? 'Alterar' : 'Enviar'}
                        </div>
                        <Input
                          id="logo-vertical-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'logo_vertical_url');
                          }}
                        />
                      </Label>
                    </div>

                    {/* Logo Symbol */}
                    <div className="flex flex-col h-full">
                      <div className="h-10 flex items-start gap-2 mb-3">
                        <Badge variant="outline" className="text-xs shrink-0">Símbolo</Badge>
                        <span className="text-xs text-muted-foreground">Ícone</span>
                      </div>
                      <div className="relative group flex-1 mb-3">
                        {config.logo_symbol_url ? (
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                            <img src={config.logo_symbol_url} alt="Símbolo" className="max-w-full max-h-full object-contain p-2" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                            <span className="text-xs text-muted-foreground">Símbolo</span>
                          </div>
                        )}
                      </div>
                      <Label htmlFor="logo-symbol-upload" className="cursor-pointer block mt-auto">
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          {config.logo_symbol_url ? 'Alterar' : 'Enviar'}
                        </div>
                        <Input
                          id="logo-symbol-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'logo_symbol_url');
                          }}
                        />
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Colors Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Cores da Marca</CardTitle>
                      <CardDescription>Defina as cores principais do seu site</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.primary_color || '#000000'}
                          onChange={(e) => setConfig(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.primary_color || ''}
                          onChange={(e) => setConfig(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                          placeholder="#000000"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.secondary_color || '#666666'}
                          onChange={(e) => setConfig(prev => prev ? { ...prev, secondary_color: e.target.value } : null)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.secondary_color || ''}
                          onChange={(e) => setConfig(prev => prev ? { ...prev, secondary_color: e.target.value } : null)}
                          placeholder="#666666"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor de Destaque</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.accent_color || '#0066FF'}
                          onChange={(e) => setConfig(prev => prev ? { ...prev, accent_color: e.target.value } : null)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.accent_color || ''}
                          onChange={(e) => setConfig(prev => prev ? { ...prev, accent_color: e.target.value } : null)}
                          placeholder="#0066FF"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hero Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Seção Principal (Hero)</CardTitle>
                  <CardDescription>Configure o banner principal do seu site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título Principal</Label>
                    <Input
                      value={config.hero_title || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, hero_title: e.target.value } : null)}
                      placeholder="Encontre o imóvel dos seus sonhos"
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
                    <div className="flex items-center gap-4">
                      {config.hero_background_url && (
                        <img src={config.hero_background_url} alt="Hero" className="w-32 h-20 object-cover rounded-lg" />
                      )}
                      <Label htmlFor="hero-upload" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
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
                </CardContent>
              </Card>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Página Sobre</CardTitle>
                  <CardDescription>Informações sobre sua empresa</CardDescription>
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
                    <Label>Texto</Label>
                    <Textarea
                      value={config.about_text || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, about_text: e.target.value } : null)}
                      placeholder="Conte a história da sua empresa..."
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagem</Label>
                    <div className="flex items-center gap-4">
                      {config.about_image_url && (
                        <img src={config.about_image_url} alt="Sobre" className="w-32 h-20 object-cover rounded-lg" />
                      )}
                      <Label htmlFor="about-upload" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                  <CardDescription>Como seus clientes podem entrar em contato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Telefone
                      </Label>
                      <Input
                        value={config.phone || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                      </Label>
                      <Input
                        value={config.email || ''}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, email: e.target.value } : null)}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={config.whatsapp || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, whatsapp: e.target.value } : null)}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Endereço
                    </Label>
                    <Textarea
                      value={config.address || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, address: e.target.value } : null)}
                      placeholder="Rua, número, bairro, cidade - UF"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Redes Sociais</CardTitle>
                  <CardDescription>Links para suas redes sociais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" /> Facebook
                    </Label>
                    <Input
                      value={config.social_facebook || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, social_facebook: e.target.value } : null)}
                      placeholder="https://facebook.com/suaempresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input
                      value={config.social_instagram || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, social_instagram: e.target.value } : null)}
                      placeholder="https://instagram.com/suaempresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </Label>
                    <Input
                      value={config.social_linkedin || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, social_linkedin: e.target.value } : null)}
                      placeholder="https://linkedin.com/company/suaempresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" /> YouTube
                    </Label>
                    <Input
                      value={config.social_youtube || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, social_youtube: e.target.value } : null)}
                      placeholder="https://youtube.com/@suaempresa"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Otimização para Buscadores (SEO)</CardTitle>
                  <CardDescription>Melhore a visibilidade do seu site no Google</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título do Site</Label>
                    <Input
                      value={config.seo_title || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, seo_title: e.target.value } : null)}
                      placeholder="Nome da Empresa - Imóveis"
                    />
                    <p className="text-xs text-muted-foreground">Aparece na aba do navegador e resultados de busca</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={config.seo_description || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, seo_description: e.target.value } : null)}
                      placeholder="Descrição do seu site para os buscadores..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Até 160 caracteres. Aparece nos resultados de busca</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras-chave</Label>
                    <Input
                      value={config.seo_keywords || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, seo_keywords: e.target.value } : null)}
                      placeholder="imóveis, apartamentos, casas, venda, aluguel"
                    />
                    <p className="text-xs text-muted-foreground">Separadas por vírgula</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile Save Button */}
          <div className="lg:hidden pt-4 space-y-2">
            <Button variant="admin" onClick={handleSave} disabled={saving} className="w-full" size="lg">
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/" target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Site
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerContent;
