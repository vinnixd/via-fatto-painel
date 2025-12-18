import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
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
  Map,
  Filter,
  FileText,
  Eye,
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

const PortalConfigPage = () => {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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

  const formatDate = (date: string) => {
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
      <AdminHeader
        title={portal.nome}
        subtitle={`Configuração do portal ${portal.slug}`}
      />

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="conexao" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="mapeamento" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
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
              </CardContent>
            </Card>
          </TabsContent>

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
