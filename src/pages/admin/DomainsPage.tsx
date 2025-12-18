import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Settings,
  Link as LinkIcon,
  Calendar,
  Shield,
  Trash2,
  Star,
  CheckCircle,
  ExternalLink,
  Globe,
  Copy,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data - in the future this would come from the database
const initialDomains = [
  {
    id: '1',
    domain: 'viafatto.lovable.app',
    isDefault: true,
    isPrimary: false,
    status: 'active' as const,
    sslStatus: 'active' as const,
  },
  {
    id: '2',
    domain: 'viafatto.com.br',
    isDefault: false,
    isPrimary: true,
    status: 'active' as const,
    sslStatus: 'active' as const,
  },
  {
    id: '3',
    domain: 'www.viafatto.com.br',
    isDefault: false,
    isPrimary: false,
    status: 'active' as const,
    sslStatus: 'active' as const,
  },
];

const helpCards = [
  {
    icon: Settings,
    title: 'Configure seu domínio',
    description: 'Use um domínio próprio para destacar a identidade da sua marca.',
    linkText: 'Ver tutorial',
    linkUrl: 'https://docs.lovable.dev/features/custom-domain',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: LinkIcon,
    title: 'Verifique a configuração',
    description: 'Siga estes passos para revisar se seu domínio ficou corretamente vinculado.',
    linkText: 'Ver tutorial',
    linkUrl: 'https://docs.lovable.dev/features/custom-domain',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    icon: Calendar,
    title: 'Consulte o vencimento',
    description: 'Identifique se o registro do seu domínio deve ser renovado em breve.',
    linkText: 'Ver tutorial',
    linkUrl: 'https://docs.lovable.dev/features/custom-domain',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: Shield,
    title: 'Certificado de segurança',
    description: 'Saiba se seu certificado de segurança está ativo.',
    linkText: 'Ver tutorial',
    linkUrl: 'https://docs.lovable.dev/features/custom-domain',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
];

const DomainsPage = () => {
  const [domains, setDomains] = useState(initialDomains);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    toast.success('Domínio copiado para a área de transferência');
  };

  const handleSetPrimary = (domainId: string) => {
    setDomains(prev => prev.map(d => ({
      ...d,
      isPrimary: d.id === domainId && !d.isDefault
    })));
    toast.success('Domínio definido como principal');
  };

  const handleDeleteDomain = () => {
    if (domainToDelete) {
      setDomains(prev => prev.filter(d => d.id !== domainToDelete));
      toast.success('Domínio removido com sucesso');
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Digite um domínio válido');
      return;
    }

    setIsAdding(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newEntry = {
      id: String(Date.now()),
      domain: newDomain.trim(),
      isDefault: false,
      isPrimary: false,
      status: 'active' as const,
      sslStatus: 'active' as const,
    };
    
    setDomains(prev => [...prev, newEntry]);
    setNewDomain('');
    setIsAddDialogOpen(false);
    setIsAdding(false);
    toast.success('Domínio adicionado com sucesso', {
      description: 'Configure os registros DNS para ativar o domínio.',
    });
  };

  const primaryDomain = domains.find(d => d.isPrimary);
  const defaultDomain = domains.find(d => d.isDefault);

  return (
    <AdminLayout>
      <AdminHeader title="Domínios" subtitle="Gerencie os domínios do seu site" />
      
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-xl">
            O domínio é o endereço do seu site na Internet. Você pode ter mais de um e gerenciá-los aqui.
          </p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="admin" className="gap-2 shadow-lg shadow-neutral-900/20">
                <Plus className="h-4 w-4" />
                Adicionar domínio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar novo domínio</DialogTitle>
                <DialogDescription>
                  Digite o domínio que deseja conectar ao seu site. Você precisará configurar os registros DNS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    placeholder="exemplo.com.br"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Configuração DNS necessária:</p>
                      <ul className="space-y-1">
                        <li>Registro A: <code className="bg-muted px-1 rounded">185.158.133.1</code></li>
                        <li>Registro TXT: <code className="bg-muted px-1 rounded">_lovable</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="admin" onClick={handleAddDomain} disabled={isAdding}>
                  {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de domínios</p>
                  <p className="text-2xl font-bold">{domains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SSL ativo</p>
                  <p className="text-2xl font-bold">{domains.filter(d => d.sslStatus === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Domínio principal</p>
                  <p className="text-sm font-medium truncate max-w-[150px]">
                    {primaryDomain?.domain || defaultDomain?.domain || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domains Table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Administre seus domínios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-semibold">Domínio</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Certificado SSL</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-medium">{domain.domain}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {domain.isDefault && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                Padrão
                              </Badge>
                            )}
                            {domain.isPrimary && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-amber-500 hover:bg-amber-600">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                Principal
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {domain.status === 'active' ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1.5 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {domain.sslStatus === 'active' ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
                        >
                          <Shield className="h-3 w-3" />
                          SSL ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1.5 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopyDomain(domain.domain)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar domínio</TooltipContent>
                        </Tooltip>
                        {!domain.isPrimary && !domain.isDefault && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSetPrimary(domain.id)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Definir como principal</TooltipContent>
                          </Tooltip>
                        )}
                        {!domain.isDefault && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDomainToDelete(domain.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover domínio</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Help Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Aprenda mais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpCards.map((card, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border-transparent hover:border-primary/20"
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 rounded-xl ${card.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                      <a
                        href={card.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1 pt-1 font-medium"
                      >
                        {card.linkText}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="flex justify-center pt-4 pb-8">
          <a
            href="https://docs.lovable.dev/features/custom-domain"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            Mais sobre domínios
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover domínio</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este domínio? Esta ação não pode ser desfeita e o domínio deixará de funcionar imediatamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDomain}
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

export default DomainsPage;
