import { Link, LinkProps } from 'react-router-dom';
import { useAdminRoutes } from '@/hooks/useAdminRoutes';

interface AdminLinkProps extends Omit<LinkProps, 'to'> {
  /** Rota admin no formato /admin/... */
  to: string;
}

/**
 * Componente Link que converte rotas /admin/... para URLs limpas quando no subdomínio admin
 */
export const AdminLink = ({ to, children, ...props }: AdminLinkProps) => {
  const { getPath } = useAdminRoutes();
  const targetPath = getPath(to);
  
  return (
    <Link to={targetPath} {...props}>
      {children}
    </Link>
  );
};

export default AdminLink;
