import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Globe, Save, Search, FileText, Tag } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface SeoConfig {
  id: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

const SeoContent = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SeoConfig | null>(null);

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
        .select('id, seo_title, seo_description, seo_keywords')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as SeoConfig);
      } else {
        const { data: newConfig, error: insertError } = await supabase
          .from('site_config')
          .upsert({ tenant_id: tenantId }, { onConflict: 'tenant_id' })
          .select('id, seo_title, seo_description, seo_keywords')
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
