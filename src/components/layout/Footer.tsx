import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '@/lib/utils';

const Footer = () => {
  const { data: siteConfig, isLoading } = useSiteConfig();

  const phoneNumber = siteConfig?.phone || '(11) 99988-7766';
  const whatsappUrl = buildWhatsAppUrl({ phone: siteConfig?.whatsapp, message: 'Olá! Gostaria de saber mais sobre os imóveis.' });
  const email = siteConfig?.email || 'contato@viafatto.com.br';
  const address = siteConfig?.address || 'SCLRN 714 Bloco G\nAsa Norte - Brasília/DF\nCEP: 70760-507';
  const footerText = siteConfig?.footer_text || '© 2024 Via Fatto Imóveis. Todos os direitos reservados.';

  return (
    <footer className="bg-neutral-900 text-neutral-100">
      <div className="container">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo e Descrição */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                {isLoading ? (
                  <div className="h-14 w-[150px]" />
                ) : (siteConfig?.logo_horizontal_url || siteConfig?.logo_url) ? (
                  <img 
                    src={siteConfig.logo_horizontal_url || siteConfig.logo_url} 
                    alt="Via Fatto Imóveis" 
                    className="h-14 w-auto object-contain brightness-0 invert"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xl">V</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-sm text-neutral-400">CRECI-DF: 29588</p>
                  <p className="text-sm text-neutral-400">CRECI-GO: 42119</p>
                </div>
              </div>
              <p className="text-neutral-300 mb-6 max-w-md">
                {siteConfig?.about_text?.substring(0, 200) || 'Especializada em imóveis de alto padrão em Brasília DF. Com mais de 10 anos de experiência, oferecemos um atendimento personalizado para encontrar o imóvel dos seus sonhos.'}
                {siteConfig?.about_text && siteConfig.about_text.length > 200 ? '...' : ''}
              </p>
              <div className="flex space-x-4">
                {siteConfig?.social_instagram && (
                  <a href={siteConfig.social_instagram} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary transition-colors">
                    <Instagram size={20} />
                  </a>
                )}
                {siteConfig?.social_facebook && (
                  <a href={siteConfig.social_facebook} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary transition-colors">
                    <Facebook size={20} />
                  </a>
                )}
                {siteConfig?.social_linkedin && (
                  <a href={siteConfig.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary transition-colors">
                    <Linkedin size={20} />
                  </a>
                )}
                {siteConfig?.social_youtube && (
                  <a href={siteConfig.social_youtube} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary transition-colors">
                    <Youtube size={20} />
                  </a>
                )}
                {!siteConfig?.social_instagram && !siteConfig?.social_facebook && !siteConfig?.social_linkedin && !siteConfig?.social_youtube && (
                  <>
                    <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                      <Instagram size={20} />
                    </a>
                    <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                      <Facebook size={20} />
                    </a>
                    <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                      <Linkedin size={20} />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Links Rápidos */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-neutral-300 hover:text-primary transition-colors">
                    Início
                  </Link>
                </li>
                <li>
                  <Link to="/imoveis" className="text-neutral-300 hover:text-primary transition-colors">
                    Imóveis
                  </Link>
                </li>
                <li>
                  <Link to="/sobre" className="text-neutral-300 hover:text-primary transition-colors">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link to="/favoritos" className="text-neutral-300 hover:text-primary transition-colors">
                    Favoritos
                  </Link>
                </li>
                <li>
                  <Link to="/contato" className="text-neutral-300 hover:text-primary transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Contato</h3>
              <div className="space-y-3">
                <a 
                  href={`tel:${siteConfig?.phone || '+5511999887766'}`}
                  className="flex items-center space-x-2 text-neutral-300 hover:text-primary transition-colors"
                >
                  <Phone size={16} />
                  <span>{phoneNumber}</span>
                </a>
                <a 
                  href={`mailto:${email}`}
                  className="flex items-center space-x-2 text-neutral-300 hover:text-primary transition-colors"
                >
                  <Mail size={16} />
                  <span>{email}</span>
                </a>
                <div className="flex items-start space-x-2 text-neutral-300">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors mt-4"
                >
                  <WhatsAppIcon size={16} />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm">
              {footerText}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacidade" className="text-neutral-400 hover:text-primary text-sm transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-neutral-400 hover:text-primary text-sm transition-colors">
                Termos de Uso
              </Link>
              {(() => {
                const hostname = window.location.hostname;
                const isLovablePreview = hostname.includes('lovable.app') || hostname.includes('localhost');
                
                if (isLovablePreview) {
                  return (
                    <Link to="/admin" className="text-neutral-500 hover:text-neutral-400 text-sm transition-colors">
                      Área Restrita
                    </Link>
                  );
                }
                
                // Para produção: constrói URL absoluta para o subdomínio painel
                const rootDomain = hostname.replace(/^www\./, '');
                const adminUrl = `https://painel.${rootDomain}`;
                
                return (
                  <a 
                    href={adminUrl}
                    target="_self"
                    rel="noopener"
                    className="text-neutral-500 hover:text-neutral-400 text-sm transition-colors"
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

export default Footer;