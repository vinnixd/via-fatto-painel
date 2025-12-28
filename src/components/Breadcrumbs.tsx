import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden min-w-0 ${className}`}
    >
      <Link
        to="/"
        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Página inicial"
      >
        <Home size={16} />
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 text-muted-foreground" aria-hidden="true">
            ›
          </span>
          {item.href ? (
            <Link
              to={item.href}
              className="min-w-0 truncate text-muted-foreground hover:text-primary transition-colors"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="min-w-0 truncate text-foreground font-medium"
              aria-current="page"
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
