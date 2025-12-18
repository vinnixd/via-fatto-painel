import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'gestor' | 'marketing' | 'corretor' | 'user';

interface UserPermissions {
  role: AppRole;
  isAdmin: boolean;
  isGestor: boolean;
  isMarketing: boolean;
  isCorretor: boolean;
  canAccessUsers: boolean;
  canManageProperties: boolean;
  canManagePortals: boolean;
  loading: boolean;
}

export const usePermissions = (): UserPermissions => {
  const { isAdmin, isGestor, isMarketing, isCorretor, loading } = useAuth();

  const role: AppRole = isAdmin ? 'admin' : isGestor ? 'gestor' : isMarketing ? 'marketing' : isCorretor ? 'corretor' : 'user';

  return {
    role,
    isAdmin,
    isGestor,
    isMarketing,
    isCorretor,
    canAccessUsers: isAdmin,
    canManageProperties: isAdmin || isGestor || isMarketing || isCorretor,
    canManagePortals: isAdmin || isGestor || isMarketing,
    loading,
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
