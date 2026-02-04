import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '@/lib/utils';

const FooterTheme02 = () => {
  const { data: siteConfig, isLoading } = useSiteConfig();

  const phoneNumber = siteConfig?.phone || '(11) 99988-7766';
  const whatsappUrl = buildWhatsAppUrl({ phone: siteConfig?.whatsapp, message: 'Olá! Gostaria de saber mais sobre os imóveis.' });
  const email = siteConfig?.email || 'contato@viafatto.com.br';
  const address = siteConfig?.address || 'Brasília - DF';
  const footerText = siteConfig?.footer_text || '© 2024 Via Fatto Imóveis. Todos os direitos reservados.';

  return (
    <footer className="bg-theme02-deep-black text-theme02-light-gray">
      <div className="container">
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Logo e Descrição */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                {isLoading ? (
                  <div className="h-14 w-[150px]" />
                ) : (siteConfig?.logo_horizontal_url || siteConfig?.logo_url) ? (
                  <img 
                    src={siteConfig.logo_horizontal_url || siteConfig.logo_url} 
                    alt="Via Fatto Imóveis" 
                    className="h-14 w-auto object-contain brightness-0 invert"
                  />
                ) : (
                  <div className="w-10 h-10 bg-theme02-green rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">V</span>
                  </div>
                )}
              </div>
              <p className="text-theme02-medium-gray mb-6 max-w-md leading-relaxed">
                {siteConfig?.about_text?.substring(0, 200) || 'Com mais de uma década de experiência no mercado imobiliário de Brasília DF, dedico-me a oferecer um atendimento personalizado e encontrar o imóvel perfeito para cada cliente. Especializada em imóveis...'}
                {siteConfig?.about_text && siteConfig.about_text.length > 200 ? '...' : ''}
              </p>
              <div className="flex space-x-4">
                {siteConfig?.social_instagram && (
                  <a href={siteConfig.social_instagram} target="_blank" rel="noopener noreferrer" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    <Instagram size={20} />
                  </a>
                )}
                {siteConfig?.social_facebook && (
                  <a href={siteConfig.social_facebook} target="_blank" rel="noopener noreferrer" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    <Facebook size={20} />
                  </a>
                )}
                {siteConfig?.social_linkedin && (
                  <a href={siteConfig.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    <Linkedin size={20} />
                  </a>
                )}
                {siteConfig?.social_youtube && (
                  <a href={siteConfig.social_youtube} target="_blank" rel="noopener noreferrer" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    <Youtube size={20} />
                  </a>
                )}
                {!siteConfig?.social_instagram && !siteConfig?.social_facebook && !siteConfig?.social_linkedin && !siteConfig?.social_youtube && (
                  <>
                    <a href="#" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                      <Instagram size={20} />
                    </a>
                    <a href="#" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                      <Facebook size={20} />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Links Rápidos */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Links Rápidos</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    Início
                  </Link>
                </li>
                <li>
                  <Link to="/imoveis" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    Imóveis
                  </Link>
                </li>
                <li>
                  <Link to="/sobre" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link to="/favoritos" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    Favoritos
                  </Link>
                </li>
                <li>
                  <Link to="/contato" className="text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Contato</h3>
              <div className="space-y-4">
                <a 
                  href={`tel:${siteConfig?.phone || '+5511999887766'}`}
                  className="flex items-center space-x-3 text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200"
                >
                  <Phone size={16} className="flex-shrink-0" />
                  <span>{phoneNumber}</span>
                </a>
                <a 
                  href={`mailto:${email}`}
                  className="flex items-center space-x-3 text-theme02-medium-gray hover:text-theme02-green transition-colors duration-200"
                >
                  <Mail size={16} className="flex-shrink-0" />
                  <span className="break-all">{email}</span>
                </a>
                <div className="flex items-start space-x-3 text-theme02-medium-gray">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-theme02-green text-white px-4 py-2.5 rounded-lg hover:bg-theme02-green-hover transition-all duration-200 mt-4 text-sm font-medium"
                >
                  <WhatsAppIcon size={16} />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-theme02-dark-gray py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-theme02-medium-gray text-sm text-center md:text-left">
              {footerText}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/privacidade" className="text-theme02-medium-gray hover:text-theme02-green text-sm transition-colors duration-200">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-theme02-medium-gray hover:text-theme02-green text-sm transition-colors duration-200">
                Termos de Uso
              </Link>
              {(() => {
                const hostname = window.location.hostname;
                const isLovablePreview = hostname.includes('lovable.app') || 
                  hostname.includes('lovableproject.com') || 
                  hostname.includes('localhost');
                
                if (isLovablePreview) {
                  return (
                    <Link to="/admin" className="text-theme02-dark-gray hover:text-theme02-medium-gray text-sm transition-colors duration-200">
                      Área Restrita
                    </Link>
                  );
                }
                
                const rootDomain = hostname.replace(/^www\./, '');
                const adminUrl = `https://painel.${rootDomain}`;
                
                return (
                  <a 
                    href={adminUrl}
                    target="_self"
                    rel="noopener"
                    className="text-theme02-dark-gray hover:text-theme02-medium-gray text-sm transition-colors duration-200"
                  >
                    Área Restrita
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterTheme02;
