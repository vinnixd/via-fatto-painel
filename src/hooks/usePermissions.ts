import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'corretor' | 'user';

interface UserPermissions {
  role: AppRole;
  isAdmin: boolean;
  isCorretor: boolean;
  canAccessUsers: boolean;
  canManageProperties: boolean;
  canManagePortals: boolean;
}

export const usePermissions = (): UserPermissions & { loading: boolean } => {
  const { user, isAdmin } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.role as AppRole | null;
    },
    enabled: !!user?.id,
  });

  const role = userRole || 'user';
  const isAdminRole = role === 'admin' || isAdmin;
  const isCorretor = role === 'corretor';

  return {
    role,
    isAdmin: isAdminRole,
    isCorretor,
    canAccessUsers: isAdminRole,
    canManageProperties: isAdminRole || isCorretor,
    canManagePortals: isAdminRole,
    loading: isLoading,
  };
};

// Helper function to check if user can access a menu item
export const canAccessMenu = (menuKey: string, role: AppRole, isAdmin: boolean): boolean => {
  const adminOnlyMenus = ['usuarios'];
  
  if (adminOnlyMenus.includes(menuKey)) {
    return isAdmin || role === 'admin';
  }
  
  return true;
};
