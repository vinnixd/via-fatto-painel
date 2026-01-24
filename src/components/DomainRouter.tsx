import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Subdomínios que devem acessar o painel admin
const ADMIN_SUBDOMAINS = ['painel', 'admin', 'app'];

// Rotas públicas do site
const PUBLIC_ROUTES = [
  '/',
  '/imoveis',
  '/imovel',
  '/sobre',
  '/contato',
  '/favoritos',
];

interface DomainRouterProps {
  children: React.ReactNode;
}

/**
 * Componente que gerencia roteamento baseado em domínio
 * 
 * - painel.viafatto.com.br → redireciona para rotas /admin
 * - viafatto.com.br → mantém rotas públicas
 */
export const DomainRouter = ({ children }: DomainRouterProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    const isAdminSubdomain = ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase());
    const currentPath = location.pathname;

    // Verificar se é um subdomínio de admin
    if (isAdminSubdomain) {
      const isPublicRoute = PUBLIC_ROUTES.some(route => {
        if (route === '/') return currentPath === '/';
        return currentPath.startsWith(route);
      });

      // Se está em rota pública no subdomínio admin, redirecionar para /admin
      if (isPublicRoute) {
        navigate('/admin', { replace: true });
        setIsReady(true);
        return;
      }
    }

    setIsReady(true);
  }, [location.pathname, navigate]);

  // Renderiza os filhos após verificar o roteamento
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Verifica se está em um subdomínio de admin
 */
export const isAdminSubdomain = (): boolean => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  return ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase());
};

/**
 * Obtém a URL pública (sem subdomínio admin)
 */
export const getPublicDomainUrl = (path: string = '/'): string => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  if (ADMIN_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    const parts = hostname.split('.');
    parts.shift();
    const publicDomain = parts.join('.');
    return `https://${publicDomain}${path}`;
  }
  
  return path;
};

export default DomainRouter;
