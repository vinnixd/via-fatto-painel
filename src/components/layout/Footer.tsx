import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-100">
      <div className="container">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo e Descrição */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">S</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Via Fatto Imóveis</h2>
                  <p className="text-sm text-neutral-400">CRECI-SP 123456</p>
                </div>
              </div>
              <p className="text-neutral-300 mb-6 max-w-md">
                Especializada em imóveis de alto padrão em São Paulo. 
                Com mais de 10 anos de experiência, oferecemos um atendimento 
                personalizado para encontrar o imóvel dos seus sonhos.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                  <Linkedin size={20} />
                </a>
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
                  href="tel:+5511999887766"
                  className="flex items-center space-x-2 text-neutral-300 hover:text-primary transition-colors"
                >
                  <Phone size={16} />
                  <span>(11) 99988-7766</span>
                </a>
                <a 
                  href="mailto:contato@viafatto.com.br"
                  className="flex items-center space-x-2 text-neutral-300 hover:text-primary transition-colors"
                >
                  <Mail size={16} />
                  <span>contato@viafatto.com.br</span>
                </a>
                <div className="flex items-start space-x-2 text-neutral-300">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <span>
                    Rua Augusta, 1234<br />
                    Jardins - São Paulo/SP<br />
                    CEP: 01305-100
                  </span>
                </div>
                <a
                  href="https://wa.me/5511999887766?text=Olá! Gostaria de saber mais sobre os imóveis."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors mt-4"
                >
                  <MessageCircle size={16} />
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
              © 2024 Via Fatto Imóveis. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacidade" className="text-neutral-400 hover:text-primary text-sm transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-neutral-400 hover:text-primary text-sm transition-colors">
                Termos de Uso
              </Link>
              <Link to="/admin/login" className="text-neutral-500 hover:text-neutral-400 text-sm transition-colors">
                Área Restrita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;