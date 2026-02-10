import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, ShieldCheck, Shield, Eye, Plus, Pencil, Trash2 } from 'lucide-react';

type AppRole = 'admin' | 'gestor' | 'marketing' | 'corretor' | 'user';

interface RolePermission {
  id: string;
  role: AppRole;
  page_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  imoveis: 'Imóveis',
  leads: 'Leads / Mensagens',
  equipe: 'Equipe / Usuários',
  administracao: 'Administração',
  assinaturas: 'Assinaturas',
  categorias: 'Categorias',
  dados: 'Dados (Import/Export)',
  perfil: 'Perfil',
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  marketing: 'Marketing',
  corretor: 'Corretor',
  user: 'Usuário',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  gestor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  corretor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  user: 'bg-muted text-muted-foreground',
};

const PERMISSION_ICONS = {
  can_view: Eye,
  can_create: Plus,
  can_edit: Pencil,
  can_delete: Trash2,
};

const PERMISSION_LABELS = {
  can_view: 'Visualizar',
  can_create: 'Criar',
  can_edit: 'Editar',
  can_delete: 'Excluir',
};

const ROLES: AppRole[] = ['admin', 'gestor', 'marketing', 'corretor', 'user'];
const PAGE_KEYS = Object.keys(PAGE_LABELS);

const CargosPermissoesContent = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<AppRole>('gestor');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('page_key');

    if (error) {
      toast.error('Erro ao carregar permissões');
      console.error(error);
    } else {
      setPermissions(data || []);
    }
    setLoading(false);
  };

  const getPermission = (role: AppRole, pageKey: string) => {
    return permissions.find(p => p.role === role && p.page_key === pageKey);
  };

  const togglePermission = (role: AppRole, pageKey: string, field: keyof Pick<RolePermission, 'can_view' | 'can_create' | 'can_edit' | 'can_delete'>) => {
    if (role === 'admin') return; // Admin always has full access

    setPermissions(prev => prev.map(p => {
      if (p.role === role && p.page_key === pageKey) {
        const newValue = !p[field];
        // If disabling view, disable all others
        if (field === 'can_view' && !newValue) {
          return { ...p, can_view: false, can_create: false, can_edit: false, can_delete: false };
        }
        // If enabling create/edit/delete, also enable view
        if (field !== 'can_view' && newValue) {
          return { ...p, [field]: newValue, can_view: true };
        }
        return { ...p, [field]: newValue };
      }
      return p;
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const rolePermissions = permissions.filter(p => p.role === activeRole);

    let hasError = false;
    for (const perm of rolePermissions) {
      const { error } = await supabase
        .from('role_permissions')
        .update({
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
        })
        .eq('id', perm.id);

      if (error) {
        hasError = true;
        console.error(error);
      }
    }

    if (hasError) {
      toast.error('Erro ao salvar algumas permissões');
    } else {
      toast.success(`Permissões do cargo "${ROLE_LABELS[activeRole]}" salvas com sucesso`);
      setHasChanges(false);
    }
    setSaving(false);
  };

  const countActivePermissions = (role: AppRole) => {
    const rolePerms = permissions.filter(p => p.role === role);
    return rolePerms.filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-foreground/70" />
            <CardTitle className="text-xl">Cargos e Permissões</CardTitle>
          </div>
          <CardDescription>
            Configure os níveis de acesso para cada cargo do sistema. O Administrador sempre possui acesso total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeRole} onValueChange={(v) => { setActiveRole(v as AppRole); setHasChanges(false); }}>
            <TabsList className="w-full justify-start gap-1 flex-wrap h-auto p-1">
              {ROLES.map((role) => (
                <TabsTrigger key={role} value={role} className="gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  {ROLE_LABELS[role]}
                  <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                    {countActivePermissions(role)}/{PAGE_KEYS.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {ROLES.map((role) => (
              <TabsContent key={role} value={role} className="mt-6">
                <div className="space-y-4">
                  {role === 'admin' && (
                    <div className="bg-muted/50 border rounded-lg p-4 text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      O cargo Administrador possui acesso total ao sistema e não pode ser alterado.
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_repeat(4,80px)] bg-muted/50 border-b p-3 text-sm font-medium text-muted-foreground">
                      <span>Página / Funcionalidade</span>
                      {(Object.keys(PERMISSION_LABELS) as Array<keyof typeof PERMISSION_LABELS>).map((key) => {
                        const Icon = PERMISSION_ICONS[key];
                        return (
                          <span key={key} className="flex flex-col items-center gap-1 text-xs">
                            <Icon className="h-3.5 w-3.5" />
                            {PERMISSION_LABELS[key]}
                          </span>
                        );
                      })}
                    </div>

                    {/* Rows */}
                    {PAGE_KEYS.map((pageKey, index) => {
                      const perm = getPermission(role, pageKey);
                      if (!perm) return null;

                      return (
                        <div
                          key={pageKey}
                          className={`grid grid-cols-[1fr_repeat(4,80px)] p-3 items-center ${
                            index < PAGE_KEYS.length - 1 ? 'border-b' : ''
                          } hover:bg-muted/30 transition-colors`}
                        >
                          <span className="font-medium text-sm">{PAGE_LABELS[pageKey]}</span>
                          {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((field) => (
                            <div key={field} className="flex justify-center">
                              <Checkbox
                                checked={perm[field]}
                                onCheckedChange={() => togglePermission(role, pageKey, field)}
                                disabled={role === 'admin'}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {role !== 'admin' && (
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar Permissões
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CargosPermissoesContent;
