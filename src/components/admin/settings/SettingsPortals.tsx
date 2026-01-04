import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Rss, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  Link2,
  Settings,
  Image,
  FileText,
  ChevronRight,
  Building2,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Portal logos
import zapLogo from '@/assets/portal-logos/zap.png';
import vivarealLogo from '@/assets/portal-logos/vivareal.png';
import olxLogo from '@/assets/portal-logos/olx.png';
import imovelwebLogo from '@/assets/portal-logos/imovelweb.png';

const portalBranding: Record<string, { logo: string; color: string }> = {
  zap: { logo: zapLogo, color: 'bg-orange-500' },
  vivareal: { logo: vivarealLogo, color: 'bg-purple-600' },
  olx: { logo: olxLogo, color: 'bg-orange-600' },
  imovelweb: { logo: imovelwebLogo, color: 'bg-green-600' },
};

const SettingsPortals = () => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: properties } = useQuery({
    queryKey: ['active-properties-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      return count || 0;
    },
  });

  const { data: portals } = useQuery({
    queryKey: ['portals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portais')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const copyFeedLink = () => {
    const feedUrl = `${window.location.origin}/api/feed/xml`;
    navigator.clipboard.writeText(feedUrl);
    toast({ title: 'Link copiado para a área de transferência!' });
  };

  const handleSync = async () => {
    setSyncing('feed');
    try {
      const { error } = await supabase.functions.invoke('portal-sync', {
        body: { portalSlug: 'all' },
      });
      if (error) throw error;
      toast({ title: 'Feed atualizado com sucesso!' });
    } catch (error) {
      console.error('Error syncing:', error);
      toast({ title: 'Erro ao atualizar feed', variant: 'destructive' });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Integração automática</Badge>
              <h2 className="text-xl font-semibold text-foreground">
                Publique seus imóveis nos maiores portais do Brasil
              </h2>
              <p className="text-muted-foreground mt-1">
                Com um único link, seus imóveis aparecem automaticamente no{' '}
                <span className="text-primary font-medium">ZAP</span>,{' '}
                <span className="text-primary font-medium">VivaReal</span>,{' '}
                <span className="text-primary font-medium">OLX</span> e{' '}
                <span className="text-primary font-medium">ImovelWeb</span>. 
                Sem custos extras e sem precisar cadastrar um por um.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status dos Imóveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Status dos seus imóveis
          </CardTitle>
          <CardDescription>
            Veja quantos imóveis estão prontos para aparecer nos portais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{properties || 0}</p>
              <p className="text-sm text-muted-foreground">Imóveis públicos</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-success/10 text-center">
              <p className="text-3xl font-bold text-success">{properties || 0}</p>
              <p className="text-sm text-muted-foreground">Prontos</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-warning/10 text-center">
              <p className="text-3xl font-bold text-warning">0</p>
              <p className="text-sm text-muted-foreground">Podem melhorar</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-destructive/10 text-center">
              <p className="text-3xl font-bold text-destructive">0</p>
              <p className="text-sm text-muted-foreground">Com problemas</p>
            </div>
          </div>

          {properties === 0 && (
            <div className="mt-6 text-center py-8 border rounded-lg border-dashed">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum imóvel público encontrado.</p>
              <p className="text-sm text-muted-foreground">
                Cadastre imóveis e marque-os como públicos para publicar nos portais.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
          <CardDescription>3 passos simples</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Passo 1 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Copie o link exclusivo da sua imobiliária</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Este link é só seu e contém todos os seus imóveis públicos
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-muted-foreground">Status do feed:</span>
                <Badge variant="outline" className="text-success border-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSync}
                  disabled={syncing === 'feed'}
                >
                  <RefreshCw className={cn('h-4 w-4', syncing === 'feed' && 'animate-spin')} />
                  Atualizar
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={copyFeedLink} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar meu link
                </Button>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver feed XML
                </Button>
              </div>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Escolha onde quer publicar</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Clique no portal para ver as instruções de cadastro
              </p>

              <div className="space-y-2">
                {['zap', 'vivareal', 'olx', 'imovelweb'].map((portalId) => {
                  const branding = portalBranding[portalId];
                  const portalName = portalId === 'zap' ? 'ZAP Imóveis' : 
                    portalId === 'vivareal' ? 'VivaReal' : 
                    portalId === 'olx' ? 'OLX' : 'ImovelWeb';
                  
                  return (
                    <button
                      key={portalId}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={branding.logo} 
                          alt={portalName}
                          className="h-8 w-8 object-contain rounded"
                        />
                        <span className="font-medium">{portalName}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Pronto! Seus imóveis serão publicados</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Os portais atualizam automaticamente a cada 12-24 horas
              </p>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Atualização automática</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando você adicionar, editar ou remover um imóvel aqui no sistema, 
                  os portais vão buscar essas atualizações automaticamente. Não precisa fazer nada!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Dicas para destacar seus imóveis
          </CardTitle>
          <CardDescription>
            Siga essas dicas para ter melhores resultados nos portais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Marque como "Público"</p>
                <p className="text-xs text-muted-foreground">
                  Só imóveis marcados como públicos aparecem nos portais
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <Image className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Fotos de qualidade</p>
                <p className="text-xs text-muted-foreground">
                  Imóveis com boas fotos recebem mais contatos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Descrição completa</p>
                <p className="text-xs text-muted-foreground">
                  Preencha todos os campos para melhor ranqueamento
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <Zap className="h-5 w-5 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Status "Disponível"</p>
                <p className="text-xs text-muted-foreground">
                  Imóveis vendidos ou alugados saem automaticamente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPortals;
