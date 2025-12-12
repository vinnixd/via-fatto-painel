import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SiteConfig {
  id: string;
  logo_url: string;
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
}

const DesignerPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [activeTab, setActiveTab] = useState('brand');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as SiteConfig);
      } else {
        const { data: newConfig, error: insertError } = await supabase
          .from('site_config')
          .insert({})
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

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

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('site_config')
        .update({
          logo_url: config.logo_url,
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
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
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
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
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
    <AdminLayout>
      <AdminHeader title="Designer" subtitle="Personalize a aparência e configurações do seu site" />
      
      <div className="p-6">
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
                <p className="font-semibold">{[config.logo_url, config.hero_background_url, config.about_image_url].filter(Boolean).length} enviadas</p>
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

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
                {tabItems.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex-1 min-w-[80px]">
                    <tab.icon className="h-4 w-4 mr-1" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
                        <CardTitle>Logo da Empresa</CardTitle>
                        <CardDescription>Faça upload do logotipo da sua imobiliária</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        {config.logo_url ? (
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                            <img src={config.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            <Upload className="h-4 w-4" />
                            Enviar Logo
                          </div>
                          <Input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url')}
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx 2MB.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Favicon Upload */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Globe className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <CardTitle>Ícone do Site (Favicon)</CardTitle>
                        <CardDescription>O ícone que aparece na aba do navegador e nos favoritos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-6">
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          {config.favicon_url ? (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                              <img src={config.favicon_url} alt="Favicon" className="w-12 h-12 object-contain" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                              <Globe className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Browser Preview */}
                        {config.favicon_url && (
                          <div className="bg-neutral-800 rounded-lg p-2 flex items-center gap-2">
                            <div className="flex gap-1.5 px-2">
                              <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
                              <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
                              <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
                            </div>
                            <div className="bg-neutral-700 rounded px-3 py-1 flex items-center gap-2 text-white text-xs">
                              <img src={config.favicon_url} alt="Favicon Preview" className="w-4 h-4 object-contain" />
                              <span className="truncate max-w-[100px]">{config.seo_title || 'Via Fatto...'}</span>
                              <span className="text-neutral-400">×</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="favicon-upload" className="cursor-pointer">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                              <Upload className="h-4 w-4" />
                              {config.favicon_url ? 'Alterar ícone' : 'Enviar ícone'}
                            </div>
                            <Input
                              id="favicon-upload"
                              type="file"
                              accept="image/png,image/x-icon,image/svg+xml"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'favicon_url')}
                            />
                          </Label>
                          {config.favicon_url && (
                            <Button 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setConfig({ ...config, favicon_url: '' })}
                            >
                              Remover ícone
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Deve ser quadrado e ter pelo menos <span className="font-mono bg-muted px-1 rounded">512</span> por <span className="font-mono bg-muted px-1 rounded">512</span> píxeis.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Paleta de Cores</CardTitle>
                        <CardDescription>Defina as cores principais do seu site</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { key: 'primary_color', label: 'Cor Primária', description: 'Botões e links' },
                        { key: 'secondary_color', label: 'Cor Secundária', description: 'Destaques' },
                        { key: 'accent_color', label: 'Cor de Destaque', description: 'Badges e alertas' },
                      ].map((color) => (
                        <div key={color.key} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl border-2 border-border shadow-inner cursor-pointer transition-transform hover:scale-105"
                              style={{ backgroundColor: config[color.key as keyof SiteConfig] as string }}
                              onClick={() => document.getElementById(`color-${color.key}`)?.click()}
                            />
                            <div>
                              <Label className="font-medium">{color.label}</Label>
                              <p className="text-xs text-muted-foreground">{color.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              id={`color-${color.key}`}
                              type="color"
                              value={config[color.key as keyof SiteConfig] as string}
                              onChange={(e) => setConfig({ ...config, [color.key]: e.target.value })}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={config[color.key as keyof SiteConfig] as string}
                              onChange={(e) => setConfig({ ...config, [color.key]: e.target.value })}
                              className="flex-1 font-mono"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Color Preview */}
                    <div className="mt-6 p-4 rounded-xl bg-muted/50">
                      <p className="text-sm font-medium mb-3">Prévia das cores</p>
                      <div className="flex gap-3">
                        <div 
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          Botão Primário
                        </div>
                        <div 
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: config.secondary_color }}
                        >
                          Secundário
                        </div>
                        <div 
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: config.accent_color }}
                        >
                          Destaque
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
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Type className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Textos do Hero</CardTitle>
                        <CardDescription>Configure o título e subtítulo da seção principal</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero_title">Título Principal</Label>
                      <Input
                        id="hero_title"
                        value={config.hero_title}
                        onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                        placeholder="Encontre seu imóvel dos sonhos"
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground">{config.hero_title?.length || 0}/60 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hero_subtitle">Subtítulo</Label>
                      <Textarea
                        id="hero_subtitle"
                        value={config.hero_subtitle}
                        onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                        placeholder="A melhor seleção de imóveis da região"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Image className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Imagem de Fundo</CardTitle>
                        <CardDescription>Escolha uma imagem impactante para o hero</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {config.hero_background_url && (
                        <div className="relative rounded-xl overflow-hidden aspect-video max-w-lg">
                          <img 
                            src={config.hero_background_url} 
                            alt="Hero Background" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 text-white">
                            <h3 className="font-bold text-lg">{config.hero_title || 'Título do Hero'}</h3>
                            <p className="text-sm opacity-80">{config.hero_subtitle || 'Subtítulo'}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Label htmlFor="hero-bg-upload" className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                            <Upload className="h-4 w-4" />
                            Enviar Imagem
                          </div>
                          <Input
                            id="hero-bg-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'hero_background_url')}
                          />
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Ou insira uma URL</Label>
                        <Input
                          value={config.hero_background_url}
                          onChange={(e) => setConfig({ ...config, hero_background_url: e.target.value })}
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
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
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Seção Sobre</CardTitle>
                        <CardDescription>Conte a história da sua imobiliária</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="about_title">Título da Seção</Label>
                      <Input
                        id="about_title"
                        value={config.about_title}
                        onChange={(e) => setConfig({ ...config, about_title: e.target.value })}
                        placeholder="Sobre Nós"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="about_text">Texto Sobre</Label>
                      <Textarea
                        id="about_text"
                        value={config.about_text}
                        onChange={(e) => setConfig({ ...config, about_text: e.target.value })}
                        rows={8}
                        placeholder="Conte a história da sua imobiliária, seus valores e diferenciais..."
                      />
                      <p className="text-xs text-muted-foreground">{config.about_text?.length || 0} caracteres</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Image className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Imagem do Corretor</CardTitle>
                        <CardDescription>Foto para a seção sobre</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      {config.about_image_url ? (
                        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-border">
                          <img 
                            src={config.about_image_url} 
                            alt="About" 
                            className="w-full h-full object-cover"
                            style={{ 
                              objectPosition: config.about_image_position === 'top' ? 'top' : config.about_image_position === 'bottom' ? 'bottom' : 'center' 
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Label htmlFor="about-img-upload" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                          <Upload className="h-4 w-4" />
                          Enviar Foto
                        </div>
                        <Input
                          id="about-img-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'about_image_url')}
                        />
                      </Label>
                    </div>

                    <div className="space-y-3">
                      <Label>Posição da Imagem</Label>
                      <p className="text-xs text-muted-foreground">Ajuste qual parte da foto deve ser exibida</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'top', label: 'Topo' },
                          { value: 'center', label: 'Centro' },
                          { value: 'bottom', label: 'Base' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setConfig({ ...config, about_image_position: option.value as 'top' | 'center' | 'bottom' })}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              config.about_image_position === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80 text-foreground'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rodapé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="footer_text">Texto do Rodapé</Label>
                      <Input
                        id="footer_text"
                        value={config.footer_text}
                        onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
                        placeholder="© 2024 Via Fatto Imóveis. Todos os direitos reservados."
                      />
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
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Informações de Contato</CardTitle>
                        <CardDescription>Dados de contato exibidos no site</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={config.phone || ''}
                          onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                          placeholder="(62) 3333-4444"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp
                        </Label>
                        <Input
                          id="whatsapp"
                          value={config.whatsapp || ''}
                          onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                          placeholder="5562999999999"
                        />
                        <p className="text-xs text-muted-foreground">Formato: 55 + DDD + número (apenas números)</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={config.email || ''}
                        onChange={(e) => setConfig({ ...config, email: e.target.value })}
                        placeholder="contato@viafatto.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </Label>
                      <Textarea
                        id="address"
                        value={config.address || ''}
                        onChange={(e) => setConfig({ ...config, address: e.target.value })}
                        placeholder="Rua das Flores, 123 - Centro, Pirenópolis - GO"
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
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Share2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Redes Sociais</CardTitle>
                        <CardDescription>Links para suas redes sociais</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="social_instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                      </Label>
                      <Input
                        id="social_instagram"
                        value={config.social_instagram || ''}
                        onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                        placeholder="https://instagram.com/viafatto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="social_facebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                      </Label>
                      <Input
                        id="social_facebook"
                        value={config.social_facebook || ''}
                        onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                        placeholder="https://facebook.com/viafatto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="social_linkedin" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-blue-700" />
                        LinkedIn
                      </Label>
                      <Input
                        id="social_linkedin"
                        value={config.social_linkedin || ''}
                        onChange={(e) => setConfig({ ...config, social_linkedin: e.target.value })}
                        placeholder="https://linkedin.com/company/viafatto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="social_youtube" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-600" />
                        YouTube
                      </Label>
                      <Input
                        id="social_youtube"
                        value={config.social_youtube || ''}
                        onChange={(e) => setConfig({ ...config, social_youtube: e.target.value })}
                        placeholder="https://youtube.com/@viafatto"
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
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Otimização para Buscadores (SEO)</CardTitle>
                        <CardDescription>Melhore a visibilidade do seu site no Google</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="seo_title">Título do Site (Title Tag)</Label>
                      <Input
                        id="seo_title"
                        value={config.seo_title || ''}
                        onChange={(e) => setConfig({ ...config, seo_title: e.target.value })}
                        placeholder="Via Fatto Imóveis | Casas e Apartamentos em Pirenópolis"
                      />
                      <p className="text-xs text-muted-foreground">{config.seo_title?.length || 0}/60 caracteres (ideal: 50-60)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seo_description">Meta Descrição</Label>
                      <Textarea
                        id="seo_description"
                        value={config.seo_description || ''}
                        onChange={(e) => setConfig({ ...config, seo_description: e.target.value })}
                        placeholder="Encontre os melhores imóveis em Pirenópolis e região. Casas, apartamentos, chácaras e terrenos. Atendimento personalizado."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">{config.seo_description?.length || 0}/160 caracteres (ideal: 150-160)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seo_keywords">Palavras-chave</Label>
                      <Input
                        id="seo_keywords"
                        value={config.seo_keywords || ''}
                        onChange={(e) => setConfig({ ...config, seo_keywords: e.target.value })}
                        placeholder="imóveis pirenópolis, casas venda, apartamentos aluguel, chácara"
                      />
                      <p className="text-xs text-muted-foreground">Separe as palavras-chave por vírgula</p>
                    </div>

                    {/* SEO Preview */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm font-medium mb-3">Prévia no Google</p>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                          {config.seo_title || 'Título do seu site'}
                        </p>
                        <p className="text-green-700 text-sm">www.seusite.com.br</p>
                        <p className="text-gray-600 text-sm mt-1">
                          {config.seo_description || 'Descrição do seu site aparecerá aqui nos resultados de busca...'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mobile Save Button */}
            <div className="lg:hidden flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
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

              <Button variant="outline" size="lg" asChild>
                <Link to="/" target="_blank">
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DesignerPage;
