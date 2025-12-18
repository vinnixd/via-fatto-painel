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
import { Loader2, Globe, Phone, Mail, MapPin, Search, Upload } from 'lucide-react';

interface SiteConfig {
  id: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_linkedin: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image_url: string;
}

const SettingsPage = () => {
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
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!config) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `og-image-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setConfig({ ...config, og_image_url: urlData.publicUrl });
      toast.success('Imagem OG enviada!');
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
          phone: config.phone,
          whatsapp: config.whatsapp,
          email: config.email,
          address: config.address,
          social_facebook: config.social_facebook,
          social_instagram: config.social_instagram,
          social_youtube: config.social_youtube,
          social_linkedin: config.social_linkedin,
          seo_title: config.seo_title,
          seo_description: config.seo_description,
          seo_keywords: config.seo_keywords,
          og_image_url: config.og_image_url,
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
      <AdminHeader title="Configurações" subtitle="Configure as informações do site" />
      
      <div className="p-6">
        <Tabs defaultValue="contact" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="social">
              <Globe className="h-4 w-4 mr-2" />
              Redes Sociais
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="h-4 w-4 mr-2" />
              SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-10"
                        value={config.phone || ''}
                        onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        className="pl-10"
                        value={config.whatsapp || ''}
                        onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                        placeholder="5500000000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Comercial</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={config.email || ''}
                        onChange={(e) => setConfig({ ...config, email: e.target.value })}
                        placeholder="contato@imobiliaria.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        className="pl-10"
                        value={config.address || ''}
                        onChange={(e) => setConfig({ ...config, address: e.target.value })}
                        placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Redes Sociais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={config.social_facebook || ''}
                      onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                      placeholder="https://facebook.com/sua-pagina"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={config.social_instagram || ''}
                      onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                      placeholder="https://instagram.com/seu-perfil"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={config.social_youtube || ''}
                      onChange={(e) => setConfig({ ...config, social_youtube: e.target.value })}
                      placeholder="https://youtube.com/seu-canal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={config.social_linkedin || ''}
                      onChange={(e) => setConfig({ ...config, social_linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/sua-empresa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Otimização para Buscadores (SEO)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">Título do Site</Label>
                  <Input
                    id="seo_title"
                    value={config.seo_title || ''}
                    onChange={(e) => setConfig({ ...config, seo_title: e.target.value })}
                    placeholder="Nome da Imobiliária | Imóveis em Sua Cidade"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">{(config.seo_title || '').length}/60 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_description">Meta Descrição</Label>
                  <Textarea
                    id="seo_description"
                    value={config.seo_description || ''}
                    onChange={(e) => setConfig({ ...config, seo_description: e.target.value })}
                    placeholder="Descrição breve do site para aparecer nos resultados de busca..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{(config.seo_description || '').length}/160 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">Palavras-chave</Label>
                  <Input
                    id="seo_keywords"
                    value={config.seo_keywords || ''}
                    onChange={(e) => setConfig({ ...config, seo_keywords: e.target.value })}
                    placeholder="imobiliária, imóveis, casas, apartamentos, sua cidade"
                  />
                  <p className="text-xs text-muted-foreground">Separe as palavras-chave por vírgulas</p>
                </div>

                <div className="space-y-4">
                  <Label>Imagem OG (Open Graph)</Label>
                  <div className="flex items-start gap-4">
                    {config.og_image_url && (
                      <img 
                        src={config.og_image_url} 
                        alt="OG Image" 
                        className="h-24 w-44 object-cover rounded-lg" 
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      />
                      <p className="text-xs text-muted-foreground">Recomendado: 1200x630 pixels</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button variant="admin" onClick={handleSave} disabled={saving}>
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

export default SettingsPage;
