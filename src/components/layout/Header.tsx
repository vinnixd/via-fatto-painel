import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '@/lib/utils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { data: siteConfig } = useSiteConfig();

  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Imóveis', href: '/imoveis' },
    { name: 'Sobre', href: '/sobre' },
    { name: 'Favoritos', href: '/favoritos' },
    { name: 'Contato', href: '/contato' },
  ];

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const phoneNumber = siteConfig?.phone || '(11) 99988-7766';
  const whatsappUrl = buildWhatsAppUrl({
    phone: siteConfig?.whatsapp,
    message: 'Olá! Gostaria de saber mais sobre os imóveis disponíveis.',
  });

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            {siteConfig?.logo_url ? (
              <img 
                src={siteConfig.logo_url} 
                alt="Logo" 
                className="h-12 max-w-[200px] w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">V</span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActiveLink(item.href) ? 'nav-link-active' : 'nav-link'
                } transition-colors duration-200`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Contact Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href={`tel:${siteConfig?.phone || '+5511999887766'}`}
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone size={18} />
              <span className="text-sm font-medium">{phoneNumber}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center space-x-2"
            >
              <WhatsAppIcon size={18} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`${
                    isActiveLink(item.href) ? 'nav-link-active' : 'nav-link'
                  } block px-3 py-2 text-base font-medium transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border pt-4 mt-4">
                <a
                  href={`tel:${siteConfig?.phone || '+5511999887766'}`}
                  className="flex items-center space-x-2 px-3 py-2 text-muted-foreground"
                >
                  <Phone size={18} />
                  <span>{phoneNumber}</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 text-primary"
                >
                  <WhatsAppIcon size={18} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;