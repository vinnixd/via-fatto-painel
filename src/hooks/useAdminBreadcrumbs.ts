import { useLocation } from 'react-router-dom';
import { useAdminRoutes, toAdminPath } from '@/hooks/useAdminRoutes';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/imoveis': 'Imóveis',
  '/admin/imoveis/novo': 'Novo Imóvel',
  '/admin/mensagens': 'Mensagens',
  '/admin/categorias': 'Categorias',
  '/admin/designer': 'Designer',
  '/admin/configuracoes': 'Configurações',
  '/admin/perfil': 'Meu Perfil',
  '/admin/usuarios': 'Usuários',
  '/admin/portais': 'Portais',
  '/admin/integracoes': 'Integrações',
  '/admin/favoritos': 'Favoritos',
  '/admin/dados': 'Exportar',
  '/admin/dados/importar': 'Importar',
  '/admin/assinaturas': 'Pagamentos',
  '/admin/assinaturas/planos': 'Planos',
  '/admin/assinaturas/faturas': 'Faturas',
  '/admin/compartilhamento': 'Compartilhamento',
};

export function useAdminBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const { getPath, isCleanUrlMode } = useAdminRoutes();
  
  // Normaliza o pathname para o formato admin interno
  const normalizedPath = isCleanUrlMode 
    ? toAdminPath(location.pathname)
    : location.pathname;

  // Always start with Dashboard
  const dashboardHref = getPath('/admin');
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: dashboardHref }
  ];

  // If we're on the dashboard, just return it as current page (no href)
  if (normalizedPath === '/admin' || normalizedPath === '/admin/') {
    return [{ label: 'Dashboard' }];
  }

  // Build breadcrumb trail based on normalized pathname
  const segments = normalizedPath.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip 'admin' since we already have Dashboard
    if (segment === 'admin') continue;

    const isLast = i === segments.length - 1;

    // Check for exact match in routeLabels
    if (routeLabels[currentPath]) {
      breadcrumbs.push({
        label: routeLabels[currentPath],
        href: isLast ? undefined : getPath(currentPath)
      });
    } else {
      // Handle dynamic routes (property edit, portal config)
      if (currentPath.match(/^\/admin\/imoveis\/[^/]+$/) && segment !== 'novo') {
        breadcrumbs.push({
          label: 'Editar Imóvel',
          href: isLast ? undefined : getPath(currentPath)
        });
      } else if (currentPath.match(/^\/admin\/portais\/[^/]+$/)) {
        breadcrumbs.push({
          label: 'Configurar Portal',
          href: isLast ? undefined : getPath(currentPath)
        });
      }
    }
  }

  return breadcrumbs;
}
