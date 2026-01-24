import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAdminSubdomain, toAdminPath } from '@/hooks/useAdminRoutes';

// Rotas públicas do site (não-admin)
const PUBLIC_SITE_ROUTES = [
  '/sobre',
  '/contato',
  '/favoritos',
];

// Rotas que são exclusivamente públicas (existem tanto no site quanto no admin com nomes diferentes)
const SITE_ONLY_IMOVEIS_ROUTES = [
  '/imovel/', // página de detalhe do imóvel no site público
];

interface DomainRouterProps {
  children: React.ReactNode;
}

/**
 * Componente que gerencia roteamento baseado em domínio
 * 
 * - painel.viafatto.com.br → usa URLs limpas (/, /imoveis, /designer)
 * - viafatto.com.br → usa rotas públicas normais
 * 
 * No subdomínio admin, as rotas limpas são mapeadas internamente para /admin/*
 */
export const DomainRouter = ({ children }: DomainRouterProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isAdmin = isAdminSubdomain();
    const currentPath = location.pathname;

    if (isAdmin) {
      // Verifica se está tentando acessar rotas exclusivas do site público
      const isSiteOnlyRoute = PUBLIC_SITE_ROUTES.includes(currentPath) ||
        SITE_ONLY_IMOVEIS_ROUTES.some(route => currentPath.startsWith(route));

      if (isSiteOnlyRoute) {
        // Redireciona para o dashboard se tentar acessar rota pública no admin
        navigate('/', { replace: true });
        setIsReady(true);
        return;
      }

      // Se a URL já está no formato /admin/*, converte para URL limpa
      if (currentPath.startsWith('/admin')) {
        const cleanPath = currentPath.replace('/admin', '') || '/';
        navigate(cleanPath, { replace: true });
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
 * Obtém a URL pública (sem subdomínio admin)
 */
export const getPublicDomainUrl = (path: string = '/'): string => {
  const hostname = window.location.hostname;
  
  if (isAdminSubdomain()) {
    const parts = hostname.split('.');
    parts.shift();
    const publicDomain = parts.join('.');
    return `https://${publicDomain}${path}`;
  }
  
  return path;
};

export { isAdminSubdomain };
export default DomainRouter;
