import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  Loader2, 
  Mail, 
  Phone, 
  Eye, 
  Trash2, 
  Plus, 
  Search, 
  Users, 
  MessageSquare, 
  ArrowUpRight,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { buildWhatsAppUrl } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id: string | null;
  read: boolean;
  created_at: string;
  property?: {
    id: string;
    title: string;
  };
}

interface Property {
  id: string;
  title: string;
}

const MessagesPage = () => {
  const { tenant } = useTenant();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  
  // New Lead Form State
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    property_id: '',
  });

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          property:property_id (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContacts((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    if (!tenant?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title')
        .eq('tenant_id', tenant.id)
        .eq('active', true)
        .order('title');

      if (error) throw error;

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (tenant?.id) {
      fetchProperties();
    }
  }, [tenant?.id]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.map(c => c.id === id ? { ...c, read: true } : c));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleViewMessage = (contact: Contact) => {
    setSelectedContact(contact);
    if (!contact.read) {
      markAsRead(contact.id);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Lead excluído');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao excluir lead');
    } finally {
      setDeleteId(null);
    }
  };

  const handleNewLeadSubmit = async () => {
    // Validation
    if (!newLead.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!newLead.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newLead.email.trim())) {
      toast.error('Email inválido');
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          name: newLead.name.trim(),
          email: newLead.email.trim(),
          phone: newLead.phone.trim() || null,
          message: newLead.message.trim() || 'Lead adicionado manualmente',
          property_id: newLead.property_id || null,
          tenant_id: tenant?.id || null,
          read: false,
        });

      if (error) throw error;

      toast.success('Lead adicionado com sucesso!');
      setIsNewLeadOpen(false);
      setNewLead({ name: '', email: '', phone: '', message: '', property_id: '' });
      fetchContacts();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao adicionar lead');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'hoje';
    if (diffInDays === 1) return 'ontem';
    return `há ${diffInDays} dias`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (read: boolean) => {
    if (read) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Contatado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
        Novo
      </Badge>
    );
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'new' && !contact.read) ||
      (statusFilter === 'contacted' && contact.read);
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalLeads = contacts.length;
  const newLeads = contacts.filter(c => !c.read).length;
  const contactedLeads = contacts.filter(c => c.read).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Novos</p>
                <p className="text-2xl font-bold">{newLeads}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Negociação</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Convertidos</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Novos</SelectItem>
                    <SelectItem value="contacted">Contatados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => setIsNewLeadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum lead encontrado com os filtros aplicados'
                  : 'Nenhum lead recebido'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">Lead</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">Interesse</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">Origem</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">Último Contato</th>
                      <th className="text-right p-4 font-medium text-muted-foreground text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-primary/10">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm truncate max-w-[200px]">
                            {contact.property?.title || '-'}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            Site
                          </Badge>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(contact.read)}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">
                            {getRelativeTime(contact.created_at)}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewMessage(contact)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewMessage(contact)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                {contact.phone && (
                                  <DropdownMenuItem asChild>
                                    <a 
                                      href={buildWhatsAppUrl({ phone: contact.phone })} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <Phone className="h-4 w-4 mr-2" />
                                      WhatsApp
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${contact.email}`}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Enviar email
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteId(contact.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Lead Dialog */}
      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Nome *</Label>
              <Input
                id="lead-name"
                placeholder="Nome do lead"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-email">Email *</Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="email@exemplo.com"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input
                id="lead-phone"
                placeholder="(00) 00000-0000"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-property">Imóvel de Interesse</Label>
              <Select 
                value={newLead.property_id} 
                onValueChange={(value) => setNewLead({ ...newLead, property_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-message">Observações</Label>
              <Textarea
                id="lead-message"
                placeholder="Notas sobre o lead..."
                value={newLead.message}
                onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsNewLeadOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleNewLeadSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Adicionar Lead'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                    {getInitials(selectedContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedContact.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedContact.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedContact.created_at)}</p>
                </div>
                {selectedContact.property?.title && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Imóvel de Interesse</p>
                    <p className="font-medium">{selectedContact.property.title}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-muted-foreground mb-2">Mensagem</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href={`mailto:${selectedContact.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Responder por Email
                  </a>
                </Button>
                {selectedContact.phone && (
                  <Button variant="outline" asChild className="flex-1">
                    <a href={buildWhatsAppUrl({ phone: selectedContact.phone })} target="_blank" rel="noopener noreferrer">
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default MessagesPage;
