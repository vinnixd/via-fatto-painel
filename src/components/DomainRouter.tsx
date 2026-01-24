import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAdminSubdomain } from '@/hooks/useAdminRoutes';

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

/**
 * Verifica se o hostname atual é um subdomínio painel.*
 */
const isPainelSubdomain = (): boolean => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.startsWith('painel.');
};

interface DomainRouterProps {
  children: React.ReactNode;
}

/**
 * Componente que gerencia roteamento baseado em domínio
 * 
 * - painel.viafatto.com.br → redireciona para /admin e usa URLs limpas
 * - viafatto.com.br → usa rotas públicas normais
 * - viafatto.com.br/admin → redireciona para painel.viafatto.com.br
 * 
 * No subdomínio painel, as rotas limpas são mapeadas internamente para /admin/*
 */
export const DomainRouter = ({ children }: DomainRouterProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isAdmin = isAdminSubdomain();
    const isPainel = isPainelSubdomain();
    const currentPath = location.pathname;
    const hostname = window.location.hostname;

    // Em ambientes Lovable (ex: *.lovable.app), não existe subdomínio painel.*.
    // Então NÃO fazemos redirect cross-subdomain; mantemos o /admin funcionando no mesmo host.
    const isLovableHosted = hostname.includes('lovable.app') || hostname.includes('localhost');
    const rootHostname = hostname.replace(/^www\./, '');

    // NOVA REGRA: Se está no subdomínio painel.* e não está em rota admin, redireciona
    if (isPainel && !isLovableHosted) {
      // Se está na raiz ou em rota pública, redireciona para dashboard admin
      if (currentPath === '/' || PUBLIC_SITE_ROUTES.includes(currentPath)) {
        navigate('/', { replace: true });
        setIsReady(true);
        return;
      }
    }

    // Se está no domínio público e tentando acessar /admin, redireciona para subdomínio painel
    if (!isAdmin && currentPath.startsWith('/admin')) {
      if (isLovableHosted) {
        setIsReady(true);
        return;
      }

      // Constrói o subdomínio painel (ex: painel.viafatto.com.br)
      const adminDomain = `painel.${rootHostname}`;
      // Converte /admin/imoveis para /imoveis (URL limpa)
      const cleanPath = currentPath.replace('/admin', '') || '/';
      const protocol = window.location.protocol;
      
      // Redireciona para o subdomínio admin com URL limpa
      window.location.href = `${protocol}//${adminDomain}${cleanPath}`;
      return;
    }

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
