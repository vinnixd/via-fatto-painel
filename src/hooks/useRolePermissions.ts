import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'gestor' | 'marketing' | 'corretor' | 'user';

export interface RolePermission {
  id: string;
  role: AppRole;
  page_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface PagePermissions {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const PAGE_KEYS = {
  dashboard: { key: 'dashboard', label: 'Dashboard', description: 'Visualizar estatísticas gerais' },
  imoveis: { key: 'imoveis', label: 'Imóveis', description: 'Gerenciar imóveis cadastrados' },
  categorias: { key: 'categorias', label: 'Categorias', description: 'Gerenciar categorias de imóveis' },
  mensagens: { key: 'mensagens', label: 'Mensagens', description: 'Visualizar mensagens de contato' },
  favoritos: { key: 'favoritos', label: 'Favoritos', description: 'Visualizar favoritos dos visitantes' },
  usuarios: { key: 'usuarios', label: 'Usuários', description: 'Gerenciar usuários do sistema' },
  dados: { key: 'dados', label: 'Dados', description: 'Importar e exportar dados' },
  configuracoes: { key: 'configuracoes', label: 'Configurações', description: 'Acessar configurações do sistema' },
} as const;

export const ROLE_LABELS: Record<AppRole, { name: string; color: string; description: string }> = {
  admin: { 
    name: 'Administrador', 
    color: 'bg-destructive text-destructive-foreground',
    description: 'Administradores têm acesso total ao sistema.'
  },
  gestor: { 
    name: 'Gerente', 
    color: 'bg-warning text-warning-foreground',
    description: 'Gerentes podem gerenciar imóveis e equipe.'
  },
  marketing: { 
    name: 'Marketing', 
    color: 'bg-primary text-primary-foreground',
    description: 'Acesso a funcionalidades de marketing e publicação.'
  },
  corretor: { 
    name: 'Corretor', 
    color: 'bg-secondary text-secondary-foreground',
    description: 'Acesso limitado para corretores da imobiliária.'
  },
  user: { 
    name: 'Usuário', 
    color: 'bg-muted text-muted-foreground',
    description: 'Usuário básico com acesso limitado.'
  },
};

export const useRolePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('page_key', { ascending: true });

      if (error) throw error;
      
      // Map the data to proper types
      const mappedData = (data || []).map(item => ({
        ...item,
        role: item.role as AppRole
      }));
      
      setPermissions(mappedData);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Erro ao carregar permissões',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updatePermission = async (
    role: AppRole,
    pageKey: string,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .update({ [field]: value })
        .eq('role', role)
        .eq('page_key', pageKey);

      if (error) throw error;

      // Update local state
      setPermissions(prev => 
        prev.map(p => 
          p.role === role && p.page_key === pageKey 
            ? { ...p, [field]: value } 
            : p
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Erro ao atualizar permissão',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getPermissionsForRole = (role: AppRole): Record<string, PagePermissions> => {
    const rolePerms = permissions.filter(p => p.role === role);
    return rolePerms.reduce((acc, p) => {
      acc[p.page_key] = {
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      };
      return acc;
    }, {} as Record<string, PagePermissions>);
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    updatePermission,
    getPermissionsForRole,
    refetch: fetchPermissions,
  };
};

// Hook to check current user's permissions
export const useCurrentUserPermissions = () => {
  const { isAdmin, isGestor, isMarketing, isCorretor, loading: authLoading } = useAuth();
  const { permissions, loading: permLoading } = useRolePermissions();

  const getUserRole = (): AppRole => {
    if (isAdmin) return 'admin';
    if (isGestor) return 'gestor';
    if (isMarketing) return 'marketing';
    if (isCorretor) return 'corretor';
    return 'user';
  };

  const canAccess = (pageKey: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    // Admin always has full access
    if (isAdmin) return true;

    const role = getUserRole();
    const perm = permissions.find(p => p.role === role && p.page_key === pageKey);
    
    if (!perm) return false;

    switch (action) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  };

  const getPagePermissions = (pageKey: string): PagePermissions => {
    if (isAdmin) {
      return { can_view: true, can_create: true, can_edit: true, can_delete: true };
    }

    const role = getUserRole();
    const perm = permissions.find(p => p.role === role && p.page_key === pageKey);
    
    if (!perm) {
      return { can_view: false, can_create: false, can_edit: false, can_delete: false };
    }

    return {
      can_view: perm.can_view,
      can_create: perm.can_create,
      can_edit: perm.can_edit,
      can_delete: perm.can_delete,
    };
  };

  return {
    role: getUserRole(),
    isAdmin,
    loading: authLoading || permLoading,
    canAccess,
    getPagePermissions,
  };
};
