import { useMemo } from 'react';

// Subdomínios que devem usar URLs limpas (sem /admin)
const ADMIN_SUBDOMAINS = ['painel', 'admin', 'app'];

/**
 * Verifica se está em um subdomínio de admin
 */
export const isAdminSubdomain = (): boolean => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  return ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase());
};

/**
 * Mapeamento de rotas admin para rotas limpas
 */
const ADMIN_ROUTE_MAP: Record<string, string> = {
  '/admin': '/',
  '/admin/login': '/login',
  '/admin/designer': '/designer',
  '/admin/imoveis': '/imoveis',
  '/admin/imoveis/novo': '/imoveis/novo',
  '/admin/portais': '/portais',
  '/admin/integracoes': '/integracoes',
  '/admin/assinaturas': '/assinaturas',
  '/admin/assinaturas/planos': '/assinaturas/planos',
  '/admin/assinaturas/faturas': '/assinaturas/faturas',
  '/admin/mensagens': '/mensagens',
  '/admin/usuarios': '/usuarios',
  '/admin/perfil': '/perfil',
  '/admin/categorias': '/categorias',
  '/admin/configuracoes': '/configuracoes',
  '/admin/favoritos': '/favoritos',
  '/admin/dados': '/dados',
  '/admin/dados/importar': '/dados/importar',
  '/admin/compartilhamento': '/compartilhamento',
};

/**
 * Mapeamento inverso: rotas limpas para rotas admin
 */
const CLEAN_ROUTE_MAP: Record<string, string> = Object.entries(ADMIN_ROUTE_MAP).reduce(
  (acc, [admin, clean]) => {
    acc[clean] = admin;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Converte uma rota /admin/... para rota limpa quando no subdomínio admin
 */
export const toCleanPath = (adminPath: string): string => {
  if (!isAdminSubdomain()) return adminPath;
  
  // Verifica mapeamento direto
  if (ADMIN_ROUTE_MAP[adminPath]) {
    return ADMIN_ROUTE_MAP[adminPath];
  }
  
  // Rotas dinâmicas: /admin/imoveis/:id -> /imoveis/:id
  if (adminPath.startsWith('/admin/')) {
    return adminPath.replace('/admin', '');
  }
  
  return adminPath;
};

/**
 * Converte uma rota limpa para rota /admin/... 
 */
export const toAdminPath = (cleanPath: string): string => {
  // Verifica mapeamento direto
  if (CLEAN_ROUTE_MAP[cleanPath]) {
    return CLEAN_ROUTE_MAP[cleanPath];
  }
  
  // Se já começa com /admin, retorna como está
  if (cleanPath.startsWith('/admin')) {
    return cleanPath;
  }
  
  // Adiciona prefixo /admin
  return `/admin${cleanPath === '/' ? '' : cleanPath}`;
};

/**
 * Hook para gerenciar rotas do admin com suporte a URLs limpas
 */
export const useAdminRoutes = () => {
  const isCleanUrlMode = useMemo(() => isAdminSubdomain(), []);
  
  /**
   * Retorna o path correto baseado no contexto (subdomínio ou não)
   */
  const getPath = (adminPath: string): string => {
    return isCleanUrlMode ? toCleanPath(adminPath) : adminPath;
  };
  
  /**
   * Converte o pathname atual para o formato admin padrão
   */
  const normalizeCurrentPath = (pathname: string): string => {
    if (!isCleanUrlMode) return pathname;
    return toAdminPath(pathname);
  };
  
  return {
    isCleanUrlMode,
    getPath,
    normalizeCurrentPath,
    toCleanPath,
    toAdminPath,
  };
};

export default useAdminRoutes;
