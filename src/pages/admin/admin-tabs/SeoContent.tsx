import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Globe, Save, Search, FileText, Tag, Image, Upload, X } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface SeoConfig {
  id: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image_url: string;
}

const SeoContent = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<SeoConfig | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `og-image-${tenantId}.${fileExt}`;
      const filePath = `${tenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      setConfig(prev => prev ? { ...prev, og_image_url: publicUrl } : null);
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setConfig(prev => prev ? { ...prev, og_image_url: '' } : null);
  };

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
        .select('id, seo_title, seo_description, seo_keywords, og_image_url')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as SeoConfig);
      } else {
        const { data: newConfig, error: insertError } = await supabase
          .from('site_config')
          .upsert({ tenant_id: tenantId }, { onConflict: 'tenant_id' })
          .select('id, seo_title, seo_description, seo_keywords, og_image_url')
          .single();

        if (insertError) throw insertError;
        setConfig(newConfig as SeoConfig);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Erro ao carregar configurações de SEO');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config || !tenantId) {
      toast.error('Erro: configuração ou tenant não disponível');
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase
        .from('site_config')
        .update({
          seo_title: config.seo_title,
          seo_description: config.seo_description,
          seo_keywords: config.seo_keywords,
          og_image_url: config.og_image_url,
        })
        .eq('tenant_id', tenantId);

      if (error) throw error;
      toast.success('Configurações de SEO salvas!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">SEO</h2>
          <p className="text-muted-foreground">Otimização para mecanismos de busca</p>
        </div>
        <Button 
          variant="admin" 
          onClick={handleSave} 
          disabled={saving}
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

      {/* SEO Fields */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-xl">
              <Globe className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Meta Tags</CardTitle>
              <CardDescription>Informações que aparecem nos resultados de busca</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label>Título do Site</Label>
            </div>
            <Input
              value={config.seo_title || ''}
              onChange={(e) => setConfig(prev => prev ? { ...prev, seo_title: e.target.value } : null)}
              placeholder="Sua Imobiliária | Compra e Venda de Imóveis"
            />
            <p className="text-xs text-muted-foreground">
              {(config.seo_title || '').length}/60 caracteres recomendados
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Label>Descrição</Label>
            </div>
            <Textarea
              value={config.seo_description || ''}
              onChange={(e) => setConfig(prev => prev ? { ...prev, seo_description: e.target.value } : null)}
              placeholder="Encontre o imóvel ideal para você. Casas, apartamentos e terrenos..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {(config.seo_description || '').length}/160 caracteres recomendados
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Label>Palavras-chave</Label>
            </div>
            <Input
              value={config.seo_keywords || ''}
              onChange={(e) => setConfig(prev => prev ? { ...prev, seo_keywords: e.target.value } : null)}
              placeholder="imóveis, casas, apartamentos, venda, aluguel"
            />
            <p className="text-xs text-muted-foreground">Separe as palavras por vírgula</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label>Imagem de Compartilhamento (OG Image)</Label>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Essa imagem aparece quando seu site é compartilhado em redes sociais. Tamanho recomendado: 1200x630 pixels.
            </p>
            
            {config.og_image_url ? (
              <div className="relative group">
                <img 
                  src={config.og_image_url} 
                  alt="OG Image preview" 
                  className="w-full max-w-md h-auto rounded-lg border object-cover aspect-[1200/630]"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-md h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para enviar uma imagem</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}

            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Ou cole uma URL:</Label>
              <Input
                value={config.og_image_url || ''}
                onChange={(e) => setConfig(prev => prev ? { ...prev, og_image_url: e.target.value } : null)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Preview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Preview no Google</CardTitle>
              <CardDescription>Como seu site aparecerá nos resultados de busca</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-white rounded-lg border space-y-1">
            <p className="text-blue-800 text-lg hover:underline cursor-pointer truncate">
              {config.seo_title || 'Título do Site'}
            </p>
            <p className="text-green-700 text-sm truncate">www.seusite.com.br</p>
            <p className="text-gray-600 text-sm line-clamp-2">
              {config.seo_description || 'Descrição do site que aparecerá nos resultados de busca...'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEO Tips */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Dicas de SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Use palavras-chave relevantes no título e descrição
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Mantenha o título com menos de 60 caracteres
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              A descrição deve ter entre 120 e 160 caracteres
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Inclua sua cidade/região nas palavras-chave
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoContent;
