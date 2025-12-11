import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Palette, Image, FileText, Upload } from 'lucide-react';

interface SiteConfig {
  id: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_url: string;
  about_title: string;
  about_text: string;
  about_image_url: string;
  footer_text: string;
}

const DesignerPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);

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
        // Create default config
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
          primary_color: config.primary_color,
          secondary_color: config.secondary_color,
          accent_color: config.accent_color,
          hero_title: config.hero_title,
          hero_subtitle: config.hero_subtitle,
          hero_background_url: config.hero_background_url,
          about_title: config.about_title,
          about_text: config.about_text,
          about_image_url: config.about_image_url,
          footer_text: config.footer_text,
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!config) return null;

  return (
    <AdminLayout>
      <AdminHeader title="Designer" subtitle="Personalize a aparência do seu site" />
      
      <div className="p-6">
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="colors">
              <Palette className="h-4 w-4 mr-2" />
              Cores
            </TabsTrigger>
            <TabsTrigger value="hero">
              <Image className="h-4 w-4 mr-2" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="about">
              <FileText className="h-4 w-4 mr-2" />
              Sobre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Cores e Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Logo do Site</Label>
                  <div className="flex items-center gap-4">
                    {config.logo_url && (
                      <img src={config.logo_url} alt="Logo" className="h-16 object-contain bg-neutral-100 rounded p-2" />
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url')}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        id="primary_color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.secondary_color}
                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        id="secondary_color"
                        value={config.secondary_color}
                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent_color">Cor de Destaque</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.accent_color}
                        onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        id="accent_color"
                        value={config.accent_color}
                        onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Seção Hero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Título Principal</Label>
                  <Input
                    id="hero_title"
                    value={config.hero_title}
                    onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                    placeholder="Encontre seu imóvel dos sonhos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Subtítulo</Label>
                  <Input
                    id="hero_subtitle"
                    value={config.hero_subtitle}
                    onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                    placeholder="A melhor seleção de imóveis da região"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Imagem de Fundo</Label>
                  <div className="flex items-start gap-4">
                    {config.hero_background_url && (
                      <img 
                        src={config.hero_background_url} 
                        alt="Hero Background" 
                        className="h-32 w-48 object-cover rounded-lg" 
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'hero_background_url')}
                      />
                      <Input
                        value={config.hero_background_url}
                        onChange={(e) => setConfig({ ...config, hero_background_url: e.target.value })}
                        placeholder="Ou insira uma URL"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Página Sobre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="about_title">Título da Seção</Label>
                  <Input
                    id="about_title"
                    value={config.about_title}
                    onChange={(e) => setConfig({ ...config, about_title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_text">Texto Sobre</Label>
                  <Textarea
                    id="about_text"
                    value={config.about_text}
                    onChange={(e) => setConfig({ ...config, about_text: e.target.value })}
                    rows={6}
                    placeholder="Conte a história da sua imobiliária..."
                  />
                </div>

                <div className="space-y-4">
                  <Label>Imagem</Label>
                  <div className="flex items-start gap-4">
                    {config.about_image_url && (
                      <img 
                        src={config.about_image_url} 
                        alt="About" 
                        className="h-32 w-48 object-cover rounded-lg" 
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'about_image_url')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Texto do Rodapé</Label>
                  <Input
                    id="footer_text"
                    value={config.footer_text}
                    onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
                    placeholder="© 2024 Sua Imobiliária"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DesignerPage;
