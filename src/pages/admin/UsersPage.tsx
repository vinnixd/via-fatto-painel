import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Copy,
  Shield,
  UserX,
  UserCheck,
  Mail,
  Loader2,
  Clock,
  Crown,
  Briefcase,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  creci: string | null;
  status: string;
  created_at: string;
  role: string;
}

interface Invite {
  id: string;
  email: string;
  name: string | null;
  role: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

const UsersPage = () => {
  const { user } = useAuth();
  const { canAccessUsers, loading: permissionsLoading } = usePermissions();
  const { navigateAdmin } = useAdminNavigation();
  const queryClient = useQueryClient();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'corretor' as 'admin' | 'gestor' | 'marketing' | 'corretor',
    expirationDays: 7,
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!permissionsLoading && !canAccessUsers) {
      toast.error('Sem permissão para acessar esta página');
      navigateAdmin('/admin');
    }
  }, [permissionsLoading, canAccessUsers, navigateAdmin]);

  // Fetch users with roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, creci, status, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      return (profiles || []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) || 'user',
      })) as UserWithRole[];
    },
    enabled: canAccessUsers,
  });

  // Fetch pending invites
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['admin-invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invite[];
    },
    enabled: canAccessUsers,
  });

  // Statistics
  const stats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    gestores: users?.filter(u => u.role === 'gestor').length || 0,
    corretores: users?.filter(u => u.role === 'corretor').length || 0,
  };

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async (data: typeof inviteData) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expirationDays);

      const { data: invite, error } = await supabase
        .from('invites')
        .insert({
          email: data.email,
          name: data.name || null,
          role: data.role,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return invite;
    },
    onSuccess: (invite) => {
      const link = `${window.location.origin}/admin/convite/${invite.token}`;
      setGeneratedLink(link);
      queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
      toast.success('Convite criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar convite');
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'admin' | 'corretor' | 'user' })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Papel atualizado com sucesso!');
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar papel');
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });

  // Delete invite mutation
  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from('invites').delete().eq('id', inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
      toast.success('Convite removido');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover convite');
    },
  });

  const handleCreateInvite = () => {
    if (!inviteData.email) {
      toast.error('Email é obrigatório');
      return;
    }
    createInviteMutation.mutate(inviteData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado!');
  };

  const resetInviteDialog = () => {
    setInviteData({ email: '', name: '', role: 'corretor', expirationDays: 7 });
    setGeneratedLink(null);
    setInviteDialogOpen(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20"><Crown className="h-3 w-3 mr-1" />Proprietário</Badge>;
      case 'gestor':
        return <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20"><Briefcase className="h-3 w-3 mr-1" />Gerente</Badge>;
      case 'marketing':
        return <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20">Marketing</Badge>;
      case 'corretor':
        return <Badge variant="secondary">Corretor</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (permissionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Membros</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Administradores</p>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Gerentes</p>
                <p className="text-2xl font-bold text-foreground">{stats.gestores}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Corretores</p>
                <p className="text-2xl font-bold text-foreground">{stats.corretores}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invites Info + Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(invites?.length || 0) > 0 && (
              <span className="text-primary font-medium">{invites?.length} convite(s) pendente(s)</span>
            )}
          </p>
          
          <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
            if (!open) resetInviteDialog();
            else setInviteDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button variant="admin">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
                <DialogDescription>
                  Envie um convite para um novo membro se cadastrar na equipe.
                </DialogDescription>
              </DialogHeader>

              {!generatedLink ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email *</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Nome (opcional)</Label>
                    <Input
                      id="invite-name"
                      type="text"
                      placeholder="Nome do membro"
                      value={inviteData.name}
                      onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Função</Label>
                    <Select
                      value={inviteData.role}
                      onValueChange={(value: 'admin' | 'gestor' | 'marketing' | 'corretor') =>
                        setInviteData({ ...inviteData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corretor">Corretor</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="gestor">Gerente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-expiration">Expiração</Label>
                    <Select
                      value={String(inviteData.expirationDays)}
                      onValueChange={(value) =>
                        setInviteData({ ...inviteData, expirationDays: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia</SelectItem>
                        <SelectItem value="3">3 dias</SelectItem>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="14">14 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      Convite criado com sucesso!
                    </p>
                    <p className="text-xs text-green-600 mb-3">
                      Copie o link abaixo e envie para o membro:
                    </p>
                    <div className="flex gap-2">
                      <Input value={generatedLink} readOnly className="text-xs" />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedLink)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                {!generatedLink ? (
                  <>
                    <Button variant="outline" onClick={resetInviteDialog}>
                      Cancelar
                    </Button>
                    <Button
                      variant="admin"
                      onClick={handleCreateInvite}
                      disabled={createInviteMutation.isPending}
                    >
                      {createInviteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Criar Convite
                    </Button>
                  </>
                ) : (
                  <Button variant="admin" onClick={resetInviteDialog}>Fechar</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Invites Section */}
        {(invites?.length || 0) > 0 && (
          <Card className="bg-amber-50/50 border-amber-200/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-foreground">Convites Pendentes</h3>
              </div>
              
              <div className="space-y-3">
                {invites?.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{invite.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {getRoleBadge(invite.role)} • Expira em {formatDistanceToNow(new Date(invite.expires_at), { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copiar link"
                        onClick={() => copyToClipboard(`${window.location.origin}/admin/convite/${invite.token}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remover convite"
                        onClick={() => deleteInviteMutation.mutate(invite.id)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members Section */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Membros da Equipe ({users?.length || 0})</h3>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum membro encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {users?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(member.name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.name || 'Sem nome'}</p>
                          {member.id === user?.id && (
                            <Badge variant="outline" className="text-xs">Você</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(member);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Alterar Função
                          </DropdownMenuItem>
                          {member.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatusMutation.mutate({ userId: member.id, newStatus: 'inactive' })
                              }
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatusMutation.mutate({ userId: member.id, newStatus: 'active' })
                              }
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Função do Membro</DialogTitle>
              <DialogDescription>
                Altere a função de {editingUser?.name || editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Nova Função</Label>
              <Select
                value={editingUser?.role}
                onValueChange={(value: string) =>
                  setEditingUser((prev) => (prev ? { ...prev, role: value } : null))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor">Corretor</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="gestor">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (editingUser) {
                    updateRoleMutation.mutate({
                      userId: editingUser.id,
                      newRole: editingUser.role,
                    });
                  }
                }}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
