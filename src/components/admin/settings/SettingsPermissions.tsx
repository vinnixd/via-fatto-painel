import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Info, Check } from 'lucide-react';
import { 
  useRolePermissions, 
  PAGE_KEYS, 
  ROLE_LABELS,
  type AppRole 
} from '@/hooks/useRolePermissions';

const EDITABLE_ROLES: AppRole[] = ['gestor', 'marketing', 'corretor', 'user'];
const PERMISSION_TYPES = [
  { key: 'can_view', label: 'Visualizar' },
  { key: 'can_create', label: 'Criar' },
  { key: 'can_edit', label: 'Editar' },
  { key: 'can_delete', label: 'Excluir' },
] as const;

const SettingsPermissions = () => {
  const { toast } = useToast();
  const { permissions, loading, updatePermission, getPermissionsForRole } = useRolePermissions();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (
    role: AppRole, 
    pageKey: string, 
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    currentValue: boolean
  ) => {
    const updateKey = `${role}-${pageKey}-${field}`;
    setUpdating(updateKey);
    
    const success = await updatePermission(role, pageKey, field, !currentValue);
    
    if (success) {
      toast({
        title: 'Permissão atualizada',
        description: (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Alteração salva automaticamente
          </span>
        ),
      });
    }
    
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure as permissões para cada função. Administradores sempre têm acesso total.
          As alterações são salvas automaticamente.
        </AlertDescription>
      </Alert>

      {/* Admin info card */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Badge className={ROLE_LABELS.admin.color}>{ROLE_LABELS.admin.name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {ROLE_LABELS.admin.description} Administradores não podem ter suas permissões alteradas.
          </p>
        </CardContent>
      </Card>

      {/* Editable roles */}
      {EDITABLE_ROLES.map((role) => {
        const roleInfo = ROLE_LABELS[role];
        const rolePerms = getPermissionsForRole(role);
        
        return (
          <Card key={role}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Badge className={roleInfo.color}>{roleInfo.name}</Badge>
                <CardTitle className="text-lg">{roleInfo.name}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{roleInfo.description}</p>
            </CardHeader>
            <CardContent>
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 mb-4 pb-2 border-b border-border">
                <div className="text-sm font-semibold text-muted-foreground">Página</div>
                {PERMISSION_TYPES.map(type => (
                  <div key={type.key} className="text-sm font-semibold text-muted-foreground text-center">
                    {type.label}
                  </div>
                ))}
              </div>

              {/* Permission rows */}
              <div className="space-y-3">
                {Object.values(PAGE_KEYS).map((page) => {
                  const pagePerm = rolePerms[page.key] || {
                    can_view: false,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                  };

                  return (
                    <div 
                      key={page.key} 
                      className="grid grid-cols-5 gap-4 items-center py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2"
                    >
                      <div>
                        <p className="font-medium text-sm">{page.label}</p>
                        <p className="text-xs text-muted-foreground">{page.description}</p>
                      </div>
                      
                      {PERMISSION_TYPES.map(type => {
                        const isUpdating = updating === `${role}-${page.key}-${type.key}`;
                        const value = pagePerm[type.key as keyof typeof pagePerm];
                        
                        return (
                          <div key={type.key} className="flex justify-center">
                            <Switch
                              checked={value}
                              disabled={isUpdating}
                              onCheckedChange={() => 
                                handleToggle(
                                  role, 
                                  page.key, 
                                  type.key as 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
                                  value
                                )
                              }
                              className={isUpdating ? 'opacity-50' : ''}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SettingsPermissions;
