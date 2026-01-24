import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Subdomínios que devem redirecionar para o painel admin
const ADMIN_SUBDOMAINS = ['painel', 'admin', 'app'];

/**
 * Hook para roteamento baseado em domínio
 * - painel.viafatto.com.br → acessa diretamente o admin
 * - viafatto.com.br → acessa o site público
 */
export const useDomainRouting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    const isAdminSubdomain = ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase());
    const currentPath = location.pathname;

    if (isAdminSubdomain) {
      // Se estiver no subdomínio admin e acessar rota pública, redireciona para /admin
      const publicRoutes = ['/', '/imoveis', '/imovel', '/sobre', '/contato', '/favoritos'];
      const isPublicRoute = publicRoutes.some(route => 
        currentPath === route || (route !== '/' && currentPath.startsWith(route))
      );

      if (isPublicRoute && currentPath !== '/') {
        navigate('/admin', { replace: true });
      } else if (currentPath === '/') {
        navigate('/admin', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const isAdminDomain = () => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    return ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase());
  };

  const getPublicUrl = (path: string = '/') => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    if (ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      // Remove o subdomínio admin para obter o domínio público
      const parts = hostname.split('.');
      parts.shift(); // Remove o subdomínio
      const publicDomain = parts.join('.');
      return `https://${publicDomain}${path}`;
    }
    
    return path;
  };

  const getAdminUrl = (path: string = '/admin') => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    if (!ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      // Adiciona o subdomínio painel
      return `https://painel.${hostname}${path.replace('/admin', '') || '/'}`;
    }
    
    return path.replace('/admin', '') || '/';
  };

  return {
    isAdminDomain,
    getPublicUrl,
    getAdminUrl,
  };
};

export default useDomainRouting;
