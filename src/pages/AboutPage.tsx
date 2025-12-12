import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Star, Users, Home, Trophy, Phone, Mail } from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSupabaseData';

const AboutPage = () => {
  const { data: siteConfig } = useSiteConfig();

  const whatsappNumber = siteConfig?.whatsapp?.replace(/\D/g, '') || '5511999887766';
  const imagePosition = siteConfig?.about_image_position || 'center';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16">
        <div className="container">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {siteConfig?.about_title || 'Via Fatto Imóveis'}
                <span className="block text-lg font-normal text-muted-foreground mt-2">
                  CRECI-SP 123456
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {siteConfig?.about_text || 'Corretora de imóveis especializada em propriedades de alto padrão em São Paulo, com mais de uma década de experiência e centenas de clientes satisfeitos.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Olá! Gostaria de agendar uma consulta.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Agendar Consulta
                </a>
                <a
                  href={`tel:${siteConfig?.phone || '+5511999887766'}`}
                  className="btn-secondary"
                >
                  Ligar Agora
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] bg-neutral-200 rounded-2xl overflow-hidden group">
                <img
                  src={siteConfig?.about_image_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=750&fit=crop&crop=face"}
                  alt="Via Fatto Imóveis"
                  className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  style={{ 
                    objectPosition: imagePosition === 'top' ? 'top' : imagePosition === 'bottom' ? 'bottom' : 'center' 
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold">CRECI-SP</div>
                  <div className="text-lg">123456</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <Home size={32} className="mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Imóveis Vendidos</div>
            </div>
            <div className="text-center">
              <Users size={32} className="mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold mb-1">1000+</div>
              <div className="text-sm text-muted-foreground">Clientes Satisfeitos</div>
            </div>
            <div className="text-center">
              <Star size={32} className="mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold mb-1">10+</div>
              <div className="text-sm text-muted-foreground">Anos de Experiência</div>
            </div>
            <div className="text-center">
              <Trophy size={32} className="mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
            </div>
          </div>

          {/* About Content */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div>
                <h2 className="text-2xl font-bold mb-6">Nossa História</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Há mais de 10 anos atuamos no mercado imobiliário de São Paulo, 
                    sempre com foco em oferecer um atendimento diferenciado e 
                    personalizado para cada cliente.
                  </p>
                  <p>
                    Nossa paixão pelo setor imobiliário começou quando percebemos 
                    que comprar ou vender um imóvel é muito mais que uma transação 
                    comercial - é sobre realizar sonhos e construir futuro.
                  </p>
                  <p>
                    Especializados em imóveis de alto padrão nas regiões mais 
                    valorizadas de São Paulo, como Jardins, Vila Madalena, 
                    Moema e Alphaville.
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-6">Nossa Missão</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Acreditamos que cada cliente é único, com necessidades e sonhos 
                    específicos. Por isso, dedicamos tempo para entender exatamente 
                    o que você procura.
                  </p>
                  <p>
                    Nosso compromisso é oferecer transparência total no processo, 
                    desde a primeira conversa até a entrega das chaves. Você 
                    sempre saberá exatamente onde estamos no processo.
                  </p>
                  <p>
                    Mantemos relacionamentos duradouros com nossos clientes, 
                    que frequentemente nos indicam para amigos e familiares.
                  </p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-12">Nossos Serviços</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="card-property text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="text-primary" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Venda de Imóveis</h3>
                  <p className="text-muted-foreground">
                    Estratégias personalizadas para vender seu imóvel 
                    pelo melhor preço no menor tempo possível.
                  </p>
                </div>

                <div className="card-property text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-primary" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Compra de Imóveis</h3>
                  <p className="text-muted-foreground">
                    Encontramos o imóvel perfeito que atenda suas necessidades 
                    e orçamento, com total suporte jurídico.
                  </p>
                </div>

                <div className="card-property text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="text-primary" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Consultoria</h3>
                  <p className="text-muted-foreground">
                    Orientação especializada sobre investimentos imobiliários 
                    e análise de mercado.
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-12">O que dizem nossos clientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card-property p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "A equipe da Via Fatto foi fundamental na compra do nosso apartamento. 
                    Atendimento excepcional e sempre disponíveis para esclarecer dúvidas."
                  </p>
                  <div className="font-medium">— Maria Silva</div>
                  <div className="text-sm text-muted-foreground">Morumbi</div>
                </div>

                <div className="card-property p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Profissionais competentes e honestos. Venderam nossa casa 
                    em apenas 30 dias pelo preço que queríamos."
                  </p>
                  <div className="font-medium">— João Santos</div>
                  <div className="text-sm text-muted-foreground">Vila Madalena</div>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-neutral-50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Vamos Conversar?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Estamos aqui para ajudar você a encontrar o imóvel perfeito 
                ou vender sua propriedade. Entre em contato e vamos conversar 
                sobre seus objetivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Olá! Gostaria de conversar sobre imóveis.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  WhatsApp
                </a>
                <a
                  href={`tel:${siteConfig?.phone || '+5511999887766'}`}
                  className="btn-secondary"
                >
                  Telefone
                </a>
                <a
                  href={`mailto:${siteConfig?.email || 'contato@viafatto.com.br'}`}
                  className="btn-secondary"
                >
                  E-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;