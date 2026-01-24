import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Globe, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Copy, 
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface Domain {
  id: string;
  tenant_id: string;
  hostname: string;
  type: 'public' | 'admin';
  is_primary: boolean;
  verified: boolean;
  verify_token: string | null;
  created_at: string;
}

const TenantDomainsPage = () => {
  const { tenantId, isOwnerOrAdmin } = useTenant();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [newHostname, setNewHostname] = useState('');
  const [newType, setNewType] = useState<'admin' | 'public'>('admin');
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

  // Fetch domains for current tenant
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['tenant-domains', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Domain[];
    },
    enabled: !!tenantId,
  });

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async ({ hostname, type }: { hostname: string; type: 'admin' | 'public' }) => {
      if (!tenantId) throw new Error('Tenant not found');

      // Generate verification token
      const verifyToken = crypto.randomUUID().replace(/-/g, '').substring(0, 32);

      const { data, error } = await supabase
        .from('domains')
        .insert({
          tenant_id: tenantId,
          hostname: hostname.toLowerCase().trim(),
          type,
          verify_token: verifyToken,
          verified: false,
          is_primary: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
      setShowAddDialog(false);
      setNewHostname('');
      setNewType('admin');
      toast.success('Domínio adicionado! Configure o DNS para verificar.');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este domínio já está cadastrado.');
      } else {
        toast.error('Erro ao adicionar domínio.');
      }
    },
  });

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
      setShowDeleteDialog(false);
      setSelectedDomain(null);
      toast.success('Domínio removido.');
    },
    onError: () => {
      toast.error('Erro ao remover domínio.');
    },
  });

  // Verify domain mutation
  const verifyDomainMutation = useMutation({
    mutationFn: async (hostname: string) => {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { hostname },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
        toast.success('Domínio verificado com sucesso!');
      } else {
        toast.error(data.message || 'Verificação falhou.');
      }
      setVerifyingDomain(null);
    },
    onError: () => {
      toast.error('Erro ao verificar domínio.');
      setVerifyingDomain(null);
    },
  });

  const handleAddDomain = () => {
    if (!newHostname.trim()) {
      toast.error('Digite o hostname.');
      return;
    }

    // Basic hostname validation
    const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/;
    if (!hostnameRegex.test(newHostname.trim())) {
      toast.error('Hostname inválido. Ex: painel.seudominio.com.br');
      return;
    }

    addDomainMutation.mutate({ hostname: newHostname, type: newType });
  };

  const handleVerifyDomain = (domain: Domain) => {
    setVerifyingDomain(domain.id);
    verifyDomainMutation.mutate(domain.hostname);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copiado!');
  };

  const handleDeleteDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedDomain) {
      deleteDomainMutation.mutate(selectedDomain.id);
    }
  };

  const adminDomains = domains.filter(d => d.type === 'admin');
  const publicDomains = domains.filter(d => d.type === 'public');

  if (!isOwnerOrAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso negado</AlertTitle>
            <AlertDescription>
              Apenas administradores podem gerenciar domínios.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Domínios</h1>
            <p className="text-muted-foreground">
              Gerencie os domínios do seu painel e site público
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar domínio
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de domínios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{domains.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {domains.filter(d => d.verified).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {domains.filter(d => !d.verified).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domínios do Painel (Admin)
            </CardTitle>
            <CardDescription>
              Domínios para acesso ao painel administrativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : adminDomains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum domínio admin configurado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDomains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {domain.hostname}
                          {domain.is_primary && (
                            <Badge variant="secondary">Principal</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {domain.verified ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!domain.verified && domain.verify_token && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              TXT: _zatch-verify.{domain.hostname}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                {domain.verify_token}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyToken(domain.verify_token!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!domain.verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDomain(domain)}
                              disabled={verifyingDomain === domain.id}
                            >
                              {verifyingDomain === domain.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Verificar
                                </>
                              )}
                            </Button>
                          )}
                          {domain.verified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://${domain.hostname}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDomain(domain)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Public Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domínios do Site Público
            </CardTitle>
            <CardDescription>
              Domínios para acesso ao site público de imóveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : publicDomains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum domínio público configurado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicDomains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {domain.hostname}
                          {domain.is_primary && (
                            <Badge variant="secondary">Principal</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {domain.verified ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!domain.verified && domain.verify_token && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              TXT: _zatch-verify.{domain.hostname}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                {domain.verify_token}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyToken(domain.verify_token!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!domain.verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDomain(domain)}
                              disabled={verifyingDomain === domain.id}
                            >
                              {verifyingDomain === domain.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Verificar
                                </>
                              )}
                            </Button>
                          )}
                          {domain.verified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://${domain.hostname}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDomain(domain)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Como configurar um domínio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Adicione o domínio desejado (ex: painel.seudominio.com.br)</li>
              <li>No seu provedor de DNS, crie um registro TXT com o nome e valor indicados</li>
              <li>Aguarde a propagação do DNS (pode levar até 48 horas)</li>
              <li>Clique em "Verificar" para confirmar a configuração</li>
              <li>Após verificado, configure um registro A ou CNAME apontando para seu servidor</li>
            </ol>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                O registro TXT é usado apenas para verificar a propriedade do domínio. 
                Você ainda precisará configurar o registro A/CNAME para direcionar o tráfego.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Add Domain Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar domínio</DialogTitle>
              <DialogDescription>
                Adicione um novo domínio para seu painel ou site público
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  placeholder="painel.seudominio.com.br"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Digite o hostname completo sem http:// ou https://
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={newType} onValueChange={(v: 'admin' | 'public') => setNewType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Painel)</SelectItem>
                    <SelectItem value="public">Público (Site)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admin: acesso ao painel administrativo. Público: site de imóveis.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddDomain}
                disabled={addDomainMutation.isPending}
              >
                {addDomainMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o domínio{' '}
                <strong>{selectedDomain?.hostname}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default TenantDomainsPage;
