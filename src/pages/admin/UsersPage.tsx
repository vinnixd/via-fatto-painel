import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
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
  RefreshCw,
  Shield,
  UserX,
  UserCheck,
  Mail,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithRole {
  id: string;
  name: string;
  email: string;
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'corretor' as 'admin' | 'corretor',
    expirationDays: 7,
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check permissions with useEffect
  useEffect(() => {
    if (!permissionsLoading && !canAccessUsers) {
      toast.error('Sem permissão para acessar esta página');
      navigate('/admin');
    }
  }, [permissionsLoading, canAccessUsers, navigate]);

  // Fetch users with roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, creci, status, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for all users
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
        return <Badge className="bg-primary">Admin</Badge>;
      case 'gestor':
        return <Badge className="bg-blue-500">Gestor</Badge>;
      case 'corretor':
        return <Badge variant="secondary">Corretor</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-500">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Inativo</Badge>
    );
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Usuários
            </h1>
            <p className="text-neutral-500 mt-1">
              Gerencie usuários e convites do sistema
            </p>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
            if (!open) resetInviteDialog();
            else setInviteDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button variant="admin">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Envie um convite para um novo usuário se cadastrar no sistema.
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
                      placeholder="Nome do usuário"
                      value={inviteData.name}
                      onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Papel</Label>
                    <Select
                      value={inviteData.role}
                      onValueChange={(value: 'admin' | 'corretor') =>
                        setInviteData({ ...inviteData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corretor">Corretor</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
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
                      Copie o link abaixo e envie para o usuário:
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

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Usuários Cadastrados</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{getStatusBadge(u.status)}</TableCell>
                    <TableCell>
                      {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(u);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Alterar Papel
                          </DropdownMenuItem>
                          {u.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatusMutation.mutate({ userId: u.id, newStatus: 'inactive' })
                              }
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatusMutation.mutate({ userId: u.id, newStatus: 'active' })
                              }
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pending Invites */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Convites Pendentes</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : invites?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum convite pendente
                  </TableCell>
                </TableRow>
              ) : (
                invites?.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.name || '-'}</TableCell>
                    <TableCell>{getRoleBadge(invite.role)}</TableCell>
                    <TableCell>
                      {format(new Date(invite.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copiar link"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/admin/convite/${invite.token}`
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remover convite"
                          onClick={() => deleteInviteMutation.mutate(invite.id)}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Papel do Usuário</DialogTitle>
              <DialogDescription>
                Altere o papel de {editingUser?.name || editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Novo Papel</Label>
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
                  <SelectItem value="gestor">Gestor</SelectItem>
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
