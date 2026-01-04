import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import { 
  Globe, 
  Search, 
  Image, 
  Link2, 
  Crown, 
  Copy, 
  ExternalLink,
  Lock
} from 'lucide-react';

const SettingsStorefront = () => {
  const { toast } = useToast();
  const { data: siteConfig, refetch } = useSiteConfig();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImageUrl: '',
  });

  useEffect(() => {
    if (siteConfig) {
      setConfig({
        seoTitle: siteConfig.seo_title || '',
        seoDescription: siteConfig.seo_description || '',
        seoKeywords: siteConfig.seo_keywords || '',
        ogImageUrl: siteConfig.og_image_url || '',
      });
    }
  }, [siteConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_config')
        .update({
          seo_title: config.seoTitle,
          seo_description: config.seoDescription,
          seo_keywords: config.seoKeywords,
          og_image_url: config.ogImageUrl,
        })
        .eq('id', siteConfig?.id);

      if (error) throw error;
      refetch();
      toast({ title: 'Configurações salvas com sucesso!' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `og-image-${Date.now()}.${fileExt}`;
      const filePath = `og/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      setConfig(prev => ({ ...prev, ogImageUrl: urlData.publicUrl }));
      
      await supabase
        .from('site_config')
        .update({ og_image_url: urlData.publicUrl })
        .eq('id', siteConfig?.id);

      refetch();
      toast({ title: 'Imagem atualizada com sucesso!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Erro ao enviar imagem', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const vitrineUrl = `${window.location.origin}`;
  
  const copyLink = () => {
    navigator.clipboard.writeText(vitrineUrl);
    toast({ title: 'Link copiado para a área de transferência!' });
  };

  return (
    <div className="space-y-6">
      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Otimização para Buscadores (SEO)
          </CardTitle>
          <CardDescription>
            Configure como sua vitrine aparece nos resultados do Google e nas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">Título SEO</Label>
            <Input
              id="seoTitle"
              value={config.seoTitle}
              onChange={(e) => setConfig(prev => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="Ex: Imobiliária Silva - Imóveis em São Paulo"
              maxLength={60}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-primary">
                Aparece como título nos resultados do Google
              </p>
              <span className="text-xs text-muted-foreground">
                {config.seoTitle.length}/60
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="seoDescription">Descrição SEO</Label>
            <Textarea
              id="seoDescription"
              value={config.seoDescription}
              onChange={(e) => setConfig(prev => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="Ex: Encontre o imóvel dos seus sonhos! Apartamentos, casas e comerciais para venda e locação em São Paulo."
              maxLength={160}
              rows={3}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-primary">
                Descrição que aparece abaixo do título no Google
              </p>
              <span className="text-xs text-muted-foreground">
                {config.seoDescription.length}/160
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="seoKeywords">Palavras-chave</Label>
            <Input
              id="seoKeywords"
              value={config.seoKeywords}
              onChange={(e) => setConfig(prev => ({ ...prev, seoKeywords: e.target.value }))}
              placeholder="Ex: imóveis são paulo, apartamentos, casas, locação, venda"
            />
            <p className="text-xs text-primary mt-1">
              Separe as palavras-chave com vírgula
            </p>
          </div>

          <div>
            <Label>Imagem de Compartilhamento</Label>
            <div 
              className="mt-1.5 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById('og-image-upload')?.click()}
            >
              {config.ogImageUrl ? (
                <img 
                  src={config.ogImageUrl} 
                  alt="OG Image" 
                  className="max-h-32 mx-auto rounded"
                />
              ) : (
                <>
                  <Image className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Clique para fazer upload</p>
                </>
              )}
            </div>
            <input
              id="og-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <p className="text-xs text-primary mt-1">
              Imagem exibida ao compartilhar sua vitrine nas redes sociais (recomendado: 1200x630px)
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domínio Personalizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Domínio Personalizado
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            Use seu próprio domínio para sua vitrine de imóveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Recurso exclusivo Premium</h4>
            <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
              Faça upgrade para o <span className="text-primary font-medium">plano Premium</span> para usar seu 
              próprio domínio na vitrine e ter uma presença online profissional.
            </p>
            <Button>
              <Crown className="h-4 w-4 mr-2" />
              Fazer upgrade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Link da Vitrine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Link da Sua Vitrine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm truncate">
              {vitrineUrl}
            </div>
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={vitrineUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsStorefront;
