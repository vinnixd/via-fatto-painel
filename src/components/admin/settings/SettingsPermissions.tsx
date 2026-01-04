import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const roles = [
  { 
    id: 'admin', 
    name: 'Administrador', 
    color: 'bg-destructive text-destructive-foreground',
    description: 'Administradores têm acesso total por padrão, mas você pode restringir se necessário.' 
  },
  { 
    id: 'gestor', 
    name: 'Gerente', 
    color: 'bg-warning text-warning-foreground',
    description: 'Gerentes podem ter acesso amplo, configure conforme necessário.' 
  },
  { 
    id: 'corretor', 
    name: 'Corretor', 
    color: 'bg-primary text-primary-foreground',
    description: 'Corretores têm acesso limitado por padrão. Ative apenas o necessário.' 
  },
];

const pagePermissions = [
  { id: 'dashboard', name: 'Dashboard', description: 'Visualizar estatísticas gerais' },
  { id: 'diagnostico', name: 'Diagnóstico', description: 'Visualizar análise de desempenho' },
  { id: 'desempenho', name: 'Desempenho', description: 'Visualizar metas e resultados' },
  { id: 'funil', name: 'Funil de Vendas', description: 'Visualizar pipeline de vendas' },
  { id: 'contratos', name: 'Contratos', description: 'Visualizar contratos' },
  { id: 'proprietarios', name: 'Proprietários', description: 'Visualizar dados de proprietários' },
  { id: 'financeiro', name: 'Financeiro', description: 'Visualizar transações financeiras' },
  { id: 'relatorios', name: 'Relatórios', description: 'Gerar e visualizar relatórios' },
  { id: 'equipe', name: 'Equipe', description: 'Visualizar membros da equipe' },
  { id: 'configuracoes', name: 'Configurações da Imobiliária', description: 'Acessar configurações do escritório' },
];

const actionPermissions = [
  { id: 'gerenciar_equipe', name: 'Gerenciar Equipe', description: 'Adicionar/remover membros' },
  { id: 'gerenciar_convites', name: 'Gerenciar Convites', description: 'Enviar convites para equipe' },
  { id: 'editar_configuracoes', name: 'Editar Configurações', description: 'Alterar configurações do escritório' },
  { id: 'excluir_dados', name: 'Excluir Dados', description: 'Permissão para excluir registros' },
  { id: 'exportar_dados', name: 'Exportar Dados', description: 'Exportar dados e relatórios' },
];

interface RolePermissions {
  pages: Record<string, boolean>;
  actions: Record<string, boolean>;
}

const defaultPermissions: Record<string, RolePermissions> = {
  admin: {
    pages: Object.fromEntries(pagePermissions.map(p => [p.id, true])),
    actions: Object.fromEntries(actionPermissions.map(a => [a.id, true])),
  },
  gestor: {
    pages: Object.fromEntries(pagePermissions.map(p => [p.id, true])),
    actions: {
      gerenciar_equipe: false,
      gerenciar_convites: false,
      editar_configuracoes: false,
      excluir_dados: false,
      exportar_dados: true,
    },
  },
  corretor: {
    pages: {
      dashboard: false,
      diagnostico: false,
      desempenho: true,
      funil: false,
      contratos: false,
      proprietarios: false,
      financeiro: false,
      relatorios: false,
      equipe: false,
      configuracoes: false,
    },
    actions: Object.fromEntries(actionPermissions.map(a => [a.id, false])),
  },
};

const SettingsPermissions = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, RolePermissions>>(defaultPermissions);

  const handleToggle = (roleId: string, type: 'pages' | 'actions', permId: string) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [type]: {
          ...prev[roleId][type],
          [permId]: !prev[roleId][type][permId],
        },
      },
    }));
  };

  const handleSave = async (roleId: string) => {
    setSaving(roleId);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: `Permissões de ${roles.find(r => r.id === roleId)?.name} salvas!` });
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure as permissões para cada função. O proprietário sempre tem acesso total e não pode ser alterado. 
          Administradores também têm acesso total por padrão.
        </AlertDescription>
      </Alert>

      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <Badge className={role.color}>{role.name}</Badge>
              <CardTitle className="text-lg">{role.name}</CardTitle>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleSave(role.id)}
              disabled={saving === role.id}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving === role.id ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">{role.description}</p>

            {/* Page Permissions */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Acesso a Páginas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pagePermissions.map((perm) => (
                  <div 
                    key={perm.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-sm">{perm.name}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                    <Switch
                      checked={permissions[role.id]?.pages[perm.id] ?? false}
                      onCheckedChange={() => handleToggle(role.id, 'pages', perm.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Permissions */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Ações Permitidas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionPermissions.map((perm) => (
                  <div 
                    key={perm.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-sm">{perm.name}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                    <Switch
                      checked={permissions[role.id]?.actions[perm.id] ?? false}
                      onCheckedChange={() => handleToggle(role.id, 'actions', perm.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SettingsPermissions;
