import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Globe,
  Settings,
  RefreshCw,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

// Portal logos
import olxLogo from '@/assets/portal-logos/olx.png';

// Map of portal slugs to their logos/colors
const portalBranding: Record<string, { logo?: string; bgColor: string; textColor?: string }> = {
  olx: { logo: olxLogo, bgColor: '#6E0AD6' },
  vivareal: { bgColor: '#FF5A00' },
  zap: { bgColor: '#FF5A00' },
  imovelweb: { bgColor: '#1A1A1A' },
  dfimoveis: { bgColor: '#2563EB' },
  '62imoveis': { bgColor: '#16A34A' },
  facebook: { bgColor: '#1877F2' },
  chavemao: { bgColor: '#F59E0B' },
  trovit: { bgColor: '#00B5AD' },
};

interface Portal {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  metodo: 'feed' | 'api' | 'manual';
  formato_feed: 'xml' | 'json' | 'csv';
  token_feed: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface PortalStats {
  portal_id: string;
  total_publicacoes: number;
  publicados: number;
  erros: number;
  ultima_exportacao?: string;
}

const PortaisPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [syncingPortal, setSyncingPortal] = useState<string | null>(null);

  const { data: portais, isLoading } = useQuery({
    queryKey: ['portais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portais')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Portal[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['portal-stats'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('portal_logs')
        .select('portal_id, status, total_itens, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: publicacoes, error: pubError } = await supabase
        .from('portal_publicacoes')
        .select('portal_id, status');

      if (pubError) throw pubError;

      const statsMap: Record<string, PortalStats> = {};

      publicacoes?.forEach((pub) => {
        if (!statsMap[pub.portal_id]) {
          statsMap[pub.portal_id] = {
            portal_id: pub.portal_id,
            total_publicacoes: 0,
            publicados: 0,
            erros: 0,
          };
        }
        statsMap[pub.portal_id].total_publicacoes++;
        if (pub.status === 'published') statsMap[pub.portal_id].publicados++;
        if (pub.status === 'error') statsMap[pub.portal_id].erros++;
      });

      logs?.forEach((log) => {
        if (!statsMap[log.portal_id]) {
          statsMap[log.portal_id] = {
            portal_id: log.portal_id,
            total_publicacoes: 0,
            publicados: 0,
            erros: 0,
          };
        }
        if (!statsMap[log.portal_id].ultima_exportacao) {
          statsMap[log.portal_id].ultima_exportacao = log.created_at;
        }
      });

      return statsMap;
    },
  });

  const { data: propertyCount } = useQuery({
    queryKey: ['active-properties-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const togglePortal = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('portais')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portais'] });
      toast.success('Portal atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar portal');
    },
  });

  const syncPortal = async (portal: Portal) => {
    setSyncingPortal(portal.id);
    try {
      const { data, error } = await supabase.functions.invoke('portal-sync', {
        body: { portalId: portal.id },
      });

      if (error) throw error;

      toast.success(`Feed gerado com sucesso: ${data.totalItems} imóveis`);
      queryClient.invalidateQueries({ queryKey: ['portal-stats'] });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Erro ao gerar feed');
    } finally {
      setSyncingPortal(null);
    }
  };

  const copyFeedUrl = (portal: Portal) => {
    const baseUrl = window.location.origin;
    const feedUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-feed?portal=${portal.slug}&token=${portal.token_feed}`;
    navigator.clipboard.writeText(feedUrl);
    toast.success('Link do feed copiado!');
  };

  const getMethodBadge = (metodo: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      feed: { label: 'Feed', className: 'bg-blue-100 text-blue-800' },
      api: { label: 'API', className: 'bg-purple-100 text-purple-800' },
      manual: { label: 'Manual', className: 'bg-gray-100 text-gray-800' },
    };
    const variant = variants[metodo] || variants.feed;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <AdminHeader
        title="Portais"
        subtitle="Gerencie integrações com portais imobiliários"
      />

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Portais</p>
                  <p className="text-2xl font-bold">{portais?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">
                    {portais?.filter((p) => p.ativo).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Imóveis Disponíveis</p>
                  <p className="text-2xl font-bold">{propertyCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Com Erros</p>
                  <p className="text-2xl font-bold">
                    {stats ? Object.values(stats).reduce((acc, s) => acc + s.erros, 0) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portais?.map((portal) => {
              const portalStats = stats?.[portal.id];
              const isSyncing = syncingPortal === portal.id;

              return (
                <Card key={portal.id} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {portalBranding[portal.slug]?.logo ? (
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: portalBranding[portal.slug]?.bgColor }}
                          >
                            <img 
                              src={portalBranding[portal.slug].logo} 
                              alt={portal.nome}
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: portalBranding[portal.slug]?.bgColor || 'hsl(var(--primary) / 0.1)' }}
                          >
                            <span className="text-white font-bold text-lg">
                              {portal.nome.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{portal.nome}</CardTitle>
                          <CardDescription>{portal.slug}</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={portal.ativo}
                        onCheckedChange={(checked) =>
                          togglePortal.mutate({ id: portal.id, ativo: checked })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getMethodBadge(portal.metodo)}
                        <Badge variant="outline" className="uppercase">
                          {portal.formato_feed}
                        </Badge>
                        {portal.ativo ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="truncate">
                            {formatDate(portalStats?.ultima_exportacao)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{propertyCount} imóveis</span>
                        </div>
                      </div>

                      {portalStats?.erros > 0 && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>{portalStats.erros} com erro</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/portais/${portal.id}`)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncPortal(portal)}
                          disabled={isSyncing || !portal.ativo}
                        >
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Gerar Feed
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFeedUrl(portal)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PortaisPage;
