import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useAdminRoutes } from './useAdminRoutes';

/**
 * Hook para navegação no admin com suporte a URLs limpas
 * Substitui useNavigate() para rotas admin
 */
export const useAdminNavigation = () => {
  const navigate = useNavigate();
  const { getPath } = useAdminRoutes();

  /**
   * Navega para uma rota admin, convertendo automaticamente para URL limpa se necessário
   */
  const navigateAdmin = useCallback((adminPath: string, options?: { replace?: boolean }) => {
    const targetPath = getPath(adminPath);
    navigate(targetPath, options);
  }, [navigate, getPath]);

  return { navigateAdmin, navigate };
};

export default useAdminNavigation;
