import { useState } from 'react';
import { ExternalLink, Copy, Check, MessageCircle, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ShareTestPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundProperty, setFoundProperty] = useState<{
    id: string;
    slug: string;
    title: string;
    reference: string | null;
  } | null>(null);

  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const shareUrl = foundProperty 
    ? `${supabaseUrl}/functions/v1/share-property/${foundProperty.slug}`
    : '';

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Digite um ID, referência ou slug do imóvel');
      return;
    }

    setLoading(true);
    setFoundProperty(null);

    try {
      // Try to find by ID, reference, or slug
      const term = searchTerm.trim();
      
      // Check if it looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);

      let query = supabase
        .from('properties')
        .select('id, slug, title, reference');

      if (isUUID) {
        query = query.eq('id', term);
      } else {
        // Try by reference or slug
        query = query.or(`reference.eq.${term},slug.eq.${term}`);
      }

      const { data, error } = await query.limit(1).single();

      if (error || !data) {
        toast.error('Imóvel não encontrado');
        return;
      }

      setFoundProperty(data);
      toast.success('Imóvel encontrado!');
    } catch (err) {
      console.error('Error searching property:', err);
      toast.error('Erro ao buscar imóvel');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpenPreview = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank');
  };

  const handleOpenWhatsApp = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`Confira este imóvel: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Testar Prévia WhatsApp</h1>
          <p className="text-muted-foreground">Teste a prévia de compartilhamento de imóveis no WhatsApp e redes sociais</p>
        </div>
        <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Testar Prévia de Link
            </CardTitle>
            <CardDescription>
              Busque um imóvel por ID, referência ou slug para gerar o link de compartilhamento com prévia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite ID, referência ou slug do imóvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {foundProperty && (
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Imóvel encontrado:</p>
                  <p className="font-medium">{foundProperty.title}</p>
                  {foundProperty.reference && (
                    <p className="text-sm text-muted-foreground">
                      Ref: {foundProperty.reference}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Link de compartilhamento:</p>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="text-xs font-mono bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleOpenPreview} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Prévia
                  </Button>
                  <Button onClick={handleOpenWhatsApp} className="bg-green-600 hover:bg-green-700">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Testar no WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>1.</strong> Busque um imóvel pelo ID, código de referência ou slug.
            </p>
            <p>
              <strong>2.</strong> Copie o link de compartilhamento gerado.
            </p>
            <p>
              <strong>3.</strong> Cole no WhatsApp ou redes sociais — a prévia com imagem, título e descrição aparecerá automaticamente.
            </p>
            <p>
              <strong>4.</strong> Ao clicar no link, o usuário é redirecionado automaticamente para a página do imóvel após 2 segundos.
            </p>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-primary font-medium">
                💡 Dica: Use o botão "Copiar Link WhatsApp" nos cards de imóveis para copiar rapidamente.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShareTestPage;
