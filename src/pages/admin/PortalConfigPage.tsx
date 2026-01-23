import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Globe,
  ArrowLeft,
  Save,
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  Map as MapIcon,
  Filter,
  FileText,
  Eye,
  Key,
  Zap,
  Upload,
  Pause,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Clock,
  Play,
} from 'lucide-react';

interface Portal {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  metodo: 'feed' | 'api' | 'manual';
  formato_feed: 'xml' | 'json' | 'csv';
  token_feed: string;
  config: PortalConfig;
  created_at: string;
  updated_at: string;
}

interface PortalConfig {
  mapeamento?: {
    titulo?: string;
    descricao?: string;
    preco?: string;
  };
  filtros?: {
    apenas_ativos?: boolean;
    apenas_venda?: boolean;
    apenas_aluguel?: boolean;
    apenas_destaques?: boolean;
    excluir_sem_fotos?: boolean;
    excluir_sem_endereco?: boolean;
    categorias?: string[];
  };
  api_credentials?: {
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    phone?: string;
  };
  vrsync?: {
    client_id?: string;
    client_token?: string;
    show_full_address?: boolean;
    show_street_number?: boolean;
    show_complement?: boolean;
  };
  settings?: {
    default_phone?: string;
    auto_renew?: boolean;
  };
  limite_fotos?: number;
  preco_consulte?: boolean;
  remover_html?: boolean;
  dominio_base?: string;
}

interface PortalLog {
  id: string;
  status: 'success' | 'error';
  total_itens: number;
  tempo_geracao_ms: number;
  detalhes: any;
  feed_url: string;
  created_at: string;
}

interface PortalPublicacao {
  id: string;
  portal_id: string;
  imovel_id: string;
  status: 'pending' | 'published' | 'error' | 'disabled';
  external_id: string | null;
  mensagem_erro: string | null;
  ultima_tentativa: string | null;
  payload_snapshot: any;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    title: string;
    slug: string;
    price: number;
    address_city: string;
    address_state: string;
    active: boolean;
    property_images: { id: string }[];
  };
}

interface PortalJob {
  id: string;
  portal_id: string;
  imovel_id: string;
  action: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  last_error: string | null;
}

const PortalConfigPage = () => {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ ok: boolean; error?: string; accountInfo?: any } | null>(null);
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<{
    nome: string;
    ativo: boolean;
    metodo: 'feed' | 'api' | 'manual';
    formato_feed: 'xml' | 'json' | 'csv';
    token_feed: string;
    config: PortalConfig;
  }>({
    nome: '',
    ativo: false,
    metodo: 'feed',
    formato_feed: 'xml',
    token_feed: '',
    config: {
      mapeamento: {},
      filtros: {
        apenas_ativos: true,
      },
      api_credentials: {},
      settings: {},
      limite_fotos: 20,
      preco_consulte: true,
      remover_html: true,
    },
  });

  const { data: portal, isLoading } = useQuery({
    queryKey: ['portal', portalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portais')
        .select('*')
        .eq('id', portalId)
        .single();

      if (error) throw error;
      return data as Portal;
    },
    enabled: !!portalId,
  });

  const { data: logs } = useQuery({
    queryKey: ['portal-logs', portalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_logs')
        .select('*')
        .eq('portal_id', portalId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PortalLog[];
    },
    enabled: !!portalId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, nome:name, slug')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch publications with property data
  const { data: publicacoes, isLoading: isLoadingPublicacoes, refetch: refetchPublicacoes } = useQuery({
    queryKey: ['portal-publicacoes', portalId],
    queryFn: async () => {
      // First get all active properties
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, title, slug, price, address_city, address_state, active, property_images(id)')
        .eq('active', true)
        .order('title');

      if (propError) throw propError;

      // Then get existing publications for this portal
      const { data: pubs, error: pubError } = await supabase
        .from('portal_publicacoes')
        .select('*')
        .eq('portal_id', portalId);

      if (pubError) throw pubError;

      // Map publications to properties
      const pubMap = new Map((pubs || []).map(p => [p.imovel_id, p]));
      
      return (properties || []).map(prop => ({
        property: prop,
        publication: pubMap.get(prop.id) || null,
      }));
    },
    enabled: !!portalId && formData.metodo === 'api',
  });

  // Fetch pending jobs
  const { data: pendingJobs } = useQuery({
    queryKey: ['portal-jobs', portalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_jobs')
        .select('*')
        .eq('portal_id', portalId)
        .in('status', ['queued', 'processing'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalJob[];
    },
    enabled: !!portalId && formData.metodo === 'api',
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (portal) {
      setFormData({
        nome: portal.nome,
        ativo: portal.ativo,
        metodo: portal.metodo,
        formato_feed: portal.formato_feed,
        token_feed: portal.token_feed,
        config: {
          mapeamento: portal.config?.mapeamento || {},
          filtros: portal.config?.filtros || { apenas_ativos: true },
          api_credentials: portal.config?.api_credentials || {},
          vrsync: portal.config?.vrsync || {
            client_id: '',
            client_token: '',
            show_full_address: true,
            show_street_number: false,
            show_complement: false,
          },
          settings: portal.config?.settings || {},
          limite_fotos: portal.config?.limite_fotos || 20,
          preco_consulte: portal.config?.preco_consulte ?? true,
          remover_html: portal.config?.remover_html ?? true,
          dominio_base: portal.config?.dominio_base || '',
        },
      });
    }
  }, [portal]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('portais')
        .update({
          nome: formData.nome,
          ativo: formData.ativo,
          metodo: formData.metodo,
          formato_feed: formData.formato_feed,
          config: JSON.parse(JSON.stringify(formData.config)),
        })
        .eq('id', portalId);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso');
      queryClient.invalidateQueries({ queryKey: ['portal', portalId] });
      queryClient.invalidateQueries({ queryKey: ['portais'] });
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateToken = async () => {
    try {
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('portais')
        .update({ token_feed: newToken })
        .eq('id', portalId);

      if (error) throw error;

      setFormData((prev) => ({ ...prev, token_feed: newToken }));
      toast.success('Token regenerado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['portal', portalId] });
    } catch (error) {
      toast.error('Erro ao regenerar token');
    }
  };

  const syncFeed = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-sync', {
        body: { portalId },
      });

      if (error) throw error;

      toast.success(`Feed gerado: ${data.totalItems} imóveis exportados`);
      queryClient.invalidateQueries({ queryKey: ['portal-logs', portalId] });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Erro ao gerar feed');
    } finally {
      setIsSyncing(false);
    }
  };

  const testFeed = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-test', {
        body: { portalId },
      });

      if (error) throw error;

      if (data.valid) {
        toast.success(`Feed válido! ${data.totalItems} imóveis disponíveis`);
      } else {
        toast.warning(`Feed com problemas: ${data.warnings?.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error('Erro ao testar feed');
    } finally {
      setIsTesting(false);
    }
  };

  const copyFeedUrl = () => {
    const feedUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-feed?portal=${portal?.slug}&token=${formData.token_feed}`;
    navigator.clipboard.writeText(feedUrl);
    toast.success('Link do feed copiado!');
  };

  // Test API connection
  const testApiConnection = async () => {
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      // First save credentials
      await handleSave();
      
      const { data, error } = await supabase.functions.invoke('portal-test', {
        body: { portalId },
      });

      if (error) throw error;

      if (data.apiConnection) {
        setApiTestResult(data.apiConnection);
        if (data.apiConnection.ok) {
          toast.success('Conexão com API estabelecida com sucesso!');
        } else {
          toast.error(`Falha na conexão: ${data.apiConnection.error}`);
        }
      } else {
        toast.warning('Teste de API não suportado para este portal');
      }
    } catch (error: any) {
      console.error('API test error:', error);
      toast.error('Erro ao testar conexão');
      setApiTestResult({ ok: false, error: error.message });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Create or update publication and queue job
  const createPublishJob = async (propertyId: string, action: 'publish' | 'update' | 'pause' | 'remove') => {
    if (!portalId) return;
    
    setProcessingJobs(prev => new Set(prev).add(propertyId));
    
    try {
      // Upsert publication record
      const { error: pubError } = await supabase
        .from('portal_publicacoes')
        .upsert({
          portal_id: portalId,
          imovel_id: propertyId,
          status: 'pending',
          mensagem_erro: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'portal_id,imovel_id',
        });

      if (pubError) throw pubError;

      // Create job
      const { error: jobError } = await supabase
        .from('portal_jobs')
        .insert({
          portal_id: portalId,
          imovel_id: propertyId,
          action,
          status: 'queued',
          attempts: 0,
          max_attempts: 5,
          next_run_at: new Date().toISOString(),
        });

      if (jobError) throw jobError;

      toast.success(`Ação "${action}" agendada com sucesso`);
      refetchPublicacoes();
      queryClient.invalidateQueries({ queryKey: ['portal-jobs', portalId] });
    } catch (error: any) {
      console.error('Create job error:', error);
      toast.error('Erro ao agendar ação');
    } finally {
      setProcessingJobs(prev => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  };

  // Run portal-push manually
  const runPortalPush = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('portal-push', {
        body: { action: 'run' },
      });

      if (error) throw error;

      toast.success(`Processados: ${data.succeeded} sucesso, ${data.failed} falhas`);
      refetchPublicacoes();
      queryClient.invalidateQueries({ queryKey: ['portal-jobs', portalId] });
    } catch (error: any) {
      console.error('Portal push error:', error);
      toast.error('Erro ao processar fila');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      published: { label: 'Publicado', className: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      error: { label: 'Erro', className: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      disabled: { label: 'Desativado', className: 'bg-gray-100 text-gray-800', icon: <Pause className="h-3 w-3" /> },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  // Check if property has pending job
  const hasPendingJob = (propertyId: string) => {
    return pendingJobs?.some(j => j.imovel_id === propertyId);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!portal) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground">Portal não encontrado</p>
          <Button variant="admin" onClick={() => navigate('/admin/portais')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin/portais')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Portais
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testFeed} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Testar Feed
            </Button>
            <Button variant="outline" onClick={syncFeed} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Gerar Feed
            </Button>
            <Button variant="admin" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="conexao" className="space-y-4">
          <TabsList className={`grid w-full ${formData.metodo === 'api' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="conexao" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Conexão
            </TabsTrigger>
            {formData.metodo === 'api' && (
              <TabsTrigger value="publicacoes" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Publicações
              </TabsTrigger>
            )}
            <TabsTrigger value="mapeamento" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" />
              Mapeamento
            </TabsTrigger>
            <TabsTrigger value="filtros" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Tab: Conexão */}
          <TabsContent value="conexao">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Conexão</CardTitle>
                <CardDescription>
                  Configure como a integração com o portal funciona
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Ativar Integração</Label>
                    <p className="text-sm text-muted-foreground">
                      Quando ativo, o feed será disponibilizado para o portal
                    </p>
                  </div>
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, ativo: checked }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Integração</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      placeholder="Ex: VivaReal - Principal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Domínio Base (para URLs)</Label>
                    <Input
                      value={formData.config.dominio_base || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          config: { ...prev.config, dominio_base: e.target.value },
                        }))
                      }
                      placeholder="https://seusite.com.br"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Método de Integração</Label>
                  <RadioGroup
                    value={formData.metodo}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        metodo: value as 'feed' | 'api' | 'manual',
                      }))
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feed" id="feed" />
                      <Label htmlFor="feed">Feed (XML/JSON/CSV)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="api" id="api" />
                      <Label htmlFor="api">API</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.metodo === 'feed' && (
                  <div className="space-y-2">
                    <Label>Formato do Feed</Label>
                    <Select
                      value={formData.formato_feed}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          formato_feed: value as 'xml' | 'json' | 'csv',
                        }))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xml">XML</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Token do Feed</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.token_feed}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={regenerateToken}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={copyFeedUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este token é usado para autenticar as requisições ao feed
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">URL do Feed</Label>
                  <code className="block mt-2 p-2 bg-background rounded text-xs break-all">
                    {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-feed?portal=${portal.slug}&token=${formData.token_feed}`}
                  </code>
                </div>

                {/* API Credentials Section */}
                {(formData.metodo === 'api' || portal.slug === 'zap' || portal.slug === 'vivareal' || portal.slug === 'imovelweb') && (
                  <Card className="border-2 border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {portal.slug === 'zap' || portal.slug === 'vivareal' || portal.slug === 'imovelweb' 
                          ? 'Credenciais VRSync' 
                          : `Credenciais API ${portal.slug.toUpperCase()}`
                        }
                      </CardTitle>
                      <CardDescription>
                        {portal.slug === 'olx' 
                          ? 'Configure suas credenciais OAuth da OLX. Obtenha em developers.olx.com.br'
                          : portal.slug === 'zap' || portal.slug === 'vivareal' || portal.slug === 'imovelweb'
                          ? `Configure suas credenciais VRSync para integração com ${portal.slug === 'imovelweb' ? 'ImovelWeb' : 'ZAP Imóveis e VivaReal'}`
                          : 'Configure as credenciais de acesso à API do portal'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {portal.slug === 'olx' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Client ID</Label>
                              <Input
                                value={formData.config.api_credentials?.client_id || ''}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      api_credentials: {
                                        ...prev.config.api_credentials,
                                        client_id: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="Seu client_id da OLX"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Client Secret</Label>
                              <Input
                                type="password"
                                value={formData.config.api_credentials?.client_secret || ''}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      api_credentials: {
                                        ...prev.config.api_credentials,
                                        client_secret: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="Seu client_secret"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Access Token</Label>
                            <Input
                              value={formData.config.api_credentials?.access_token || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  config: {
                                    ...prev.config,
                                    api_credentials: {
                                      ...prev.config.api_credentials,
                                      access_token: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="Token de acesso OAuth"
                            />
                            <p className="text-xs text-muted-foreground">
                              Token obtido após autorização do usuário via fluxo OAuth
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Refresh Token (opcional)</Label>
                              <Input
                                value={formData.config.api_credentials?.refresh_token || ''}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      api_credentials: {
                                        ...prev.config.api_credentials,
                                        refresh_token: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="Refresh token para renovação"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Telefone para Anúncios</Label>
                              <Input
                                value={formData.config.api_credentials?.phone || formData.config.settings?.default_phone || ''}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      api_credentials: {
                                        ...prev.config.api_credentials,
                                        phone: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="11999999999"
                              />
                              <p className="text-xs text-muted-foreground">
                                DDD + número (sem espaços ou caracteres)
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* VRSync Credentials (ZAP/VivaReal/ImovelWeb) */}
                      {(portal.slug === 'zap' || portal.slug === 'vivareal' || portal.slug === 'imovelweb') && (
                        <>
                          <div className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>VRSync:</strong> {portal.slug === 'imovelweb' ? 'ImovelWeb' : 'ZAP Imóveis e VivaReal'} utiliza o sistema VRSync para integração.
                                Obtenha suas credenciais no portal do parceiro.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Client ID</Label>
                                <Input
                                  value={formData.config.vrsync?.client_id || ''}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      config: {
                                        ...prev.config,
                                        vrsync: {
                                          ...prev.config.vrsync,
                                          client_id: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Seu client_id VRSync"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Identificador único da sua conta no VRSync
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label>Client Token</Label>
                                <Input
                                  type="password"
                                  value={formData.config.vrsync?.client_token || ''}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      config: {
                                        ...prev.config,
                                        vrsync: {
                                          ...prev.config.vrsync,
                                          client_token: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Seu token de autenticação"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Token secreto para autenticação no feed
                                </p>
                              </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                              <Label className="text-base font-medium mb-3 block">Exibição de Endereço</Label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Configure quais informações de endereço serão exibidas nos anúncios do portal
                              </p>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <Label className="font-medium">Exibir endereço completo</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Mostra rua, número e bairro no anúncio
                                    </p>
                                  </div>
                                  <Switch
                                    checked={formData.config.vrsync?.show_full_address ?? true}
                                    onCheckedChange={(checked) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        config: {
                                          ...prev.config,
                                          vrsync: {
                                            ...prev.config.vrsync,
                                            show_full_address: checked,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <Label className="font-medium">Exibir número do imóvel</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Mostra o número na rua (ex: "Rua ABC, 123")
                                    </p>
                                  </div>
                                  <Switch
                                    checked={formData.config.vrsync?.show_street_number ?? false}
                                    onCheckedChange={(checked) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        config: {
                                          ...prev.config,
                                          vrsync: {
                                            ...prev.config.vrsync,
                                            show_street_number: checked,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <Label className="font-medium">Exibir complemento</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Mostra apartamento, bloco ou andar
                                    </p>
                                  </div>
                                  <Switch
                                    checked={formData.config.vrsync?.show_complement ?? false}
                                    onCheckedChange={(checked) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        config: {
                                          ...prev.config,
                                          vrsync: {
                                            ...prev.config.vrsync,
                                            show_complement: checked,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Test Connection Button */}
                      <div className="pt-4 border-t flex items-center justify-between">
                        <div>
                          {apiTestResult && (
                            <div className={`flex items-center gap-2 ${apiTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                              {apiTestResult.ok ? (
                                <>
                                  <CheckCircle className="h-5 w-5" />
                                  <span>Conexão estabelecida</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-5 w-5" />
                                  <span>{apiTestResult.error}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={testApiConnection} 
                          disabled={isTestingApi || !formData.config.api_credentials?.access_token}
                        >
                          {isTestingApi ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          Testar Conexão
                        </Button>
                      </div>

                      {/* OLX specific info */}
                      {portal.slug === 'olx' && (
                        <div className="p-4 bg-blue-50 rounded-lg text-sm space-y-2">
                          <p className="font-medium text-blue-800">Como obter credenciais OLX:</p>
                          <ol className="list-decimal list-inside text-blue-700 space-y-1">
                            <li>Contate suporteintegrador@olxbr.com para registrar sua aplicação</li>
                            <li>Você receberá client_id e client_secret</li>
                            <li>Autorize sua conta via OAuth em auth.olx.com.br/oauth</li>
                            <li>Use o authorization code para obter o access_token</li>
                          </ol>
                          <p className="text-blue-600 text-xs mt-2">
                            Documentação: developers.olx.com.br/anuncio/api/oauth.html
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Publicações (only for API method) */}
          {formData.metodo === 'api' && (
            <TabsContent value="publicacoes">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Publicações no {portal.nome}</CardTitle>
                      <CardDescription>
                        Gerencie os imóveis publicados via API
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(pendingJobs?.length || 0) > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pendingJobs?.length} na fila
                        </Badge>
                      )}
                      <Button variant="outline" onClick={runPortalPush}>
                        <Play className="h-4 w-4 mr-2" />
                        Processar Fila
                      </Button>
                      <Button variant="outline" onClick={() => refetchPublicacoes()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPublicacoes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : publicacoes && publicacoes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imóvel</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Última Tentativa</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publicacoes.map(({ property, publication }) => {
                          const isProcessing = processingJobs.has(property.id) || hasPendingJob(property.id);
                          const status = publication?.status || 'not_published';
                          
                          return (
                            <TableRow key={property.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium truncate max-w-xs">{property.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {property.address_city}, {property.address_state}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {property.price > 0 
                                  ? `R$ ${property.price.toLocaleString('pt-BR')}`
                                  : <span className="text-muted-foreground">-</span>
                                }
                              </TableCell>
                              <TableCell>
                                {publication ? (
                                  <div className="space-y-1">
                                    {getStatusBadge(publication.status)}
                                    {publication.status === 'error' && publication.mensagem_erro && (
                                      <p className="text-xs text-red-600 max-w-xs truncate" title={publication.mensagem_erro}>
                                        {publication.mensagem_erro}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline">Não publicado</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(publication?.ultima_tentativa)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {isProcessing ? (
                                    <Button size="sm" variant="ghost" disabled>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    </Button>
                                  ) : (
                                    <>
                                      {(!publication || publication.status === 'error' || publication.status === 'disabled') && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => createPublishJob(property.id, 'publish')}
                                          title="Publicar"
                                        >
                                          <Upload className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {publication?.status === 'published' && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => createPublishJob(property.id, 'update')}
                                            title="Atualizar"
                                          >
                                            <RefreshCw className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => createPublishJob(property.id, 'remove')}
                                            title="Remover"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </>
                                      )}
                                      {publication?.status === 'error' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => createPublishJob(property.id, 'publish')}
                                          title="Tentar novamente"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum imóvel ativo encontrado
                    </div>
                  )}

                  {/* Pending Jobs */}
                  {pendingJobs && pendingJobs.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Jobs na Fila ({pendingJobs.length})
                      </h4>
                      <div className="space-y-2">
                        {pendingJobs.slice(0, 5).map(job => (
                          <div key={job.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant={job.status === 'processing' ? 'default' : 'secondary'}>
                                {job.status}
                              </Badge>
                              <span className="text-muted-foreground">{job.action}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Tentativa {job.attempts + 1}/{job.max_attempts}
                            </span>
                          </div>
                        ))}
                        {pendingJobs.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{pendingJobs.length - 5} mais na fila
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Tab: Mapeamento */}
          <TabsContent value="mapeamento">
            <Card>
              <CardHeader>
                <CardTitle>Mapeamento de Campos</CardTitle>
                <CardDescription>
                  Configure como os dados do imóvel são mapeados para o portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Limite de Fotos</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.config.limite_fotos || 20}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            limite_fotos: parseInt(e.target.value) || 20,
                          },
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo de fotos por imóvel no feed
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preco_consulte"
                      checked={formData.config.preco_consulte}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          config: { ...prev.config, preco_consulte: !!checked },
                        }))
                      }
                    />
                    <Label htmlFor="preco_consulte">
                      Exibir "Consulte" quando imóvel não tiver preço
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remover_html"
                      checked={formData.config.remover_html}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          config: { ...prev.config, remover_html: !!checked },
                        }))
                      }
                    />
                    <Label htmlFor="remover_html">
                      Remover HTML da descrição (sanitização)
                    </Label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Campos mapeados automaticamente:</strong> título, descrição,
                    preço, status, tipo, endereço completo, especificações (quartos,
                    suítes, banheiros, vagas, áreas), imagens.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Filtros */}
          <TabsContent value="filtros">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Publicação</CardTitle>
                <CardDescription>
                  Defina quais imóveis serão incluídos no feed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Status do Imóvel</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas_ativos"
                          checked={formData.config.filtros?.apenas_ativos}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              config: {
                                ...prev.config,
                                filtros: {
                                  ...prev.config.filtros,
                                  apenas_ativos: !!checked,
                                },
                              },
                            }))
                          }
                        />
                        <Label htmlFor="apenas_ativos">Apenas imóveis ativos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas_destaques"
                          checked={formData.config.filtros?.apenas_destaques}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              config: {
                                ...prev.config,
                                filtros: {
                                  ...prev.config.filtros,
                                  apenas_destaques: !!checked,
                                },
                              },
                            }))
                          }
                        />
                        <Label htmlFor="apenas_destaques">
                          Apenas imóveis em destaque
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Finalidade</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas_venda"
                          checked={formData.config.filtros?.apenas_venda}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              config: {
                                ...prev.config,
                                filtros: {
                                  ...prev.config.filtros,
                                  apenas_venda: !!checked,
                                  apenas_aluguel: checked ? false : prev.config.filtros?.apenas_aluguel,
                                },
                              },
                            }))
                          }
                        />
                        <Label htmlFor="apenas_venda">Apenas venda</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas_aluguel"
                          checked={formData.config.filtros?.apenas_aluguel}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              config: {
                                ...prev.config,
                                filtros: {
                                  ...prev.config.filtros,
                                  apenas_aluguel: !!checked,
                                  apenas_venda: checked ? false : prev.config.filtros?.apenas_venda,
                                },
                              },
                            }))
                          }
                        />
                        <Label htmlFor="apenas_aluguel">Apenas aluguel</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Exclusões</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="excluir_sem_fotos"
                        checked={formData.config.filtros?.excluir_sem_fotos}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              filtros: {
                                ...prev.config.filtros,
                                excluir_sem_fotos: !!checked,
                              },
                            },
                          }))
                        }
                      />
                      <Label htmlFor="excluir_sem_fotos">Excluir imóveis sem fotos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="excluir_sem_endereco"
                        checked={formData.config.filtros?.excluir_sem_endereco}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              filtros: {
                                ...prev.config.filtros,
                                excluir_sem_endereco: !!checked,
                              },
                            },
                          }))
                        }
                      />
                      <Label htmlFor="excluir_sem_endereco">
                        Excluir imóveis sem endereço (cidade/estado)
                      </Label>
                    </div>
                  </div>
                </div>

                {categories && categories.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Categorias</h4>
                    <p className="text-sm text-muted-foreground">
                      Deixe desmarcado para incluir todas as categorias
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${cat.id}`}
                            checked={formData.config.filtros?.categorias?.includes(
                              cat.id
                            )}
                            onCheckedChange={(checked) => {
                              const currentCats =
                                formData.config.filtros?.categorias || [];
                              const newCats = checked
                                ? [...currentCats, cat.id]
                                : currentCats.filter((c) => c !== cat.id);
                              setFormData((prev) => ({
                                ...prev,
                                config: {
                                  ...prev.config,
                                  filtros: {
                                    ...prev.config.filtros,
                                    categorias: newCats,
                                  },
                                },
                              }));
                            }}
                          />
                          <Label htmlFor={`cat-${cat.id}`}>{cat.nome}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Logs */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Exportações</CardTitle>
                <CardDescription>
                  Últimas 50 exportações realizadas para este portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs && logs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Imóveis</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>
                            {log.status === 'success' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sucesso
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Erro
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{log.total_itens}</TableCell>
                          <TableCell>
                            {log.tempo_geracao_ms
                              ? `${(log.tempo_geracao_ms / 1000).toFixed(2)}s`
                              : '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {typeof log.detalhes === 'string'
                              ? log.detalhes
                              : JSON.stringify(log.detalhes)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma exportação realizada ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default PortalConfigPage;
