import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '@/lib/utils';

const HeaderTheme02 = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { data: siteConfig, isLoading } = useSiteConfig();

  // Handle scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
    <header className={`bg-theme02-black border-b border-theme02-dark-gray sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-lg shadow-black/20' : ''}`}>
      <div className="container">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex-shrink-0"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            {isLoading ? (
              <div className="h-10 sm:h-12 w-[120px] sm:w-[150px]" />
            ) : (siteConfig?.logo_horizontal_url || siteConfig?.logo_url) ? (
              <img 
                src={siteConfig.logo_horizontal_url || siteConfig.logo_url} 
                alt="Logo" 
                className="h-10 sm:h-12 max-w-[150px] sm:max-w-[200px] w-auto object-contain brightness-0 invert"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-theme02-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">V</span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center h-full space-x-6 lg:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`transition-colors duration-200 text-sm lg:text-base font-medium ${
                  isActiveLink(item.href) 
                    ? 'text-theme02-green' 
                    : 'text-white hover:text-theme02-green'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Contact Actions - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href={`tel:${siteConfig?.phone || '+5511999887766'}`}
              className="flex items-center space-x-2 text-theme02-light-gray hover:text-white transition-colors"
            >
              <Phone size={16} />
              <span className="text-sm font-medium">{phoneNumber}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-theme02-green hover:bg-theme02-green-hover text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm"
            >
              <WhatsAppIcon size={16} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 text-white hover:text-theme02-green transition-colors touch-manipulation md:hidden"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Full Screen Overlay */}
      <div 
        className={`
          fixed inset-0 top-16 sm:top-18 z-40 bg-theme02-black
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <nav className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-6">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  block px-6 py-4 text-lg font-medium border-b border-theme02-dark-gray
                  transition-all duration-200 active:bg-theme02-dark-gray
                  ${isActiveLink(item.href) 
                    ? 'text-theme02-green bg-theme02-dark-gray/50 border-l-4 border-l-theme02-green' 
                    : 'text-white hover:bg-theme02-dark-gray'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Contact Actions - Mobile Footer */}
          <div className="border-t border-theme02-dark-gray p-6 space-y-3 bg-theme02-medium-gray/20 safe-area-bottom">
            <a
              href={`tel:${siteConfig?.phone || '+5511999887766'}`}
              className="flex items-center justify-center space-x-3 w-full py-4 px-6 rounded-xl bg-theme02-dark-gray text-white font-medium text-base"
            >
              <Phone size={20} />
              <span>{phoneNumber}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-3 w-full py-4 px-6 rounded-xl bg-theme02-green text-white font-medium text-base"
            >
              <WhatsAppIcon size={20} />
              <span>Falar no WhatsApp</span>
            </a>
          </div>
        </nav>
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 top-16 sm:top-18 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default HeaderTheme02;
