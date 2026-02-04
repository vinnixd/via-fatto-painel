import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Users, Home as HomeIcon, Trophy, Search, Building, TreePine, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import PropertyCardTheme02 from '@/components/ui/PropertyCardTheme02';
import { useProperties, useCategories, useSiteConfig, useAvailableCities, PropertyFromDB } from '@/hooks/useSupabaseData';
import heroHouse from '@/assets/hero-house.jpg';

// Preload hero image
const preloadHeroImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
};

const HomeTheme02 = () => {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [heroSearch, setHeroSearch] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    location: ''
  });

  const { data: allProperties = [], isLoading } = useProperties();
  const { data: featuredProperties = [] } = useProperties({ featured: true });
  const { data: categories = [] } = useCategories();
  const { data: siteConfig } = useSiteConfig();
  const { data: availableCities = [] } = useAvailableCities();

  useEffect(() => {
    const heroSrc = siteConfig?.hero_background_url || heroHouse;
    preloadHeroImage(heroSrc);
  }, [siteConfig?.hero_background_url]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const filteredProperties = allProperties.filter(property => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'residencial') {
      return property.type === 'casa' || property.type === 'apartamento';
    }
    if (activeCategory === 'comercial') {
      return property.type === 'comercial';
    }
    if (activeCategory === 'terrenos') {
      return property.type === 'terreno';
    }
    return true;
  });

  const handleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (heroSearch.category) params.set('type', heroSearch.category);
    if (heroSearch.location) params.set('location', heroSearch.location);
    if (heroSearch.minPrice) params.set('minPrice', heroSearch.minPrice);

    navigate(`/imoveis?${params.toString()}`);
  };

  const categoryFilters = [
    { id: 'all', name: 'TODOS', icon: HomeIcon, count: allProperties.length },
    { id: 'residencial', name: 'RESIDENCIAL', icon: HomeIcon, count: allProperties.filter(p => p.type === 'casa' || p.type === 'apartamento').length },
    { id: 'comercial', name: 'COMERCIAL', icon: Building, count: allProperties.filter(p => p.type === 'comercial').length },
    { id: 'terrenos', name: 'TERRENOS', icon: TreePine, count: allProperties.filter(p => p.type === 'terreno').length },
  ];

  const displayProperties = filteredProperties.slice(0, 8);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: false },
    [Autoplay({ delay: 4000, stopOnInteraction: false }) as any]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const convertToCardFormat = (property: PropertyFromDB) => ({
    id: property.id,
    title: property.title,
    slug: property.slug,
    description: property.description || '',
    price: property.price,
    status: property.status as 'venda' | 'aluguel',
    type: property.type as 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural',
    profile: property.profile as 'residencial' | 'comercial' | 'industrial' | 'misto',
    condition: property.condition || undefined,
    address: {
      street: property.address_street || '',
      neighborhood: property.address_neighborhood || '',
      city: property.address_city,
      state: property.address_state,
      zipCode: property.address_zipcode || '',
    },
    bedrooms: property.bedrooms,
    suites: property.suites,
    bathrooms: property.bathrooms,
    garages: property.garages,
    area: property.area,
    builtArea: property.built_area || undefined,
    features: property.features || [],
    amenities: property.amenities || [],
    images: property.images && property.images.length > 0 ? property.images.map(img => img.url) : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'],
    featured: property.featured,
    financing: property.financing,
    documentation: property.documentation as 'regular' | 'pendente' | 'irregular',
    reference: property.reference || '',
    views: property.views,
    broker: {
      name: 'Via Fatto Imóveis',
      phone: siteConfig?.whatsapp || '11999887766',
      email: siteConfig?.email || 'contato@viafatto.com.br',
      creci: 'CRECI-DF: 29588',
      avatar: '',
    },
    createdAt: property.created_at,
    updatedAt: property.updated_at,
  });

  return (
    <div className="min-h-screen bg-theme02-deep-black">
      {/* Hero Section */}
      <section className="relative bg-theme02-black text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={siteConfig?.hero_background_url || heroHouse}
            alt="Casa moderna"
            className="w-full h-full object-cover opacity-30"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-theme02-black/60 via-theme02-black/70 to-theme02-deep-black"></div>
        </div>
        
        <div className="relative container py-16 sm:py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-2 tracking-tight">
              {siteConfig?.hero_title || 'Encontre seu imóvel dos sonhos'}
            </h1>
            {siteConfig?.hero_subtitle && (
              <p className="text-lg sm:text-xl text-theme02-light-gray/80 px-4">{siteConfig.hero_subtitle}</p>
            )}
          </div>

          {/* Hero Search Form */}
          <div className="max-w-5xl mx-auto px-2">
            <form onSubmit={handleHeroSearch} className="bg-theme02-dark-gray rounded-2xl p-5 sm:p-8 shadow-2xl border border-theme02-medium-gray/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-theme02-light-gray mb-2">
                    Categoria
                  </label>
                  <select
                    value={heroSearch.category}
                    onChange={(e) => setHeroSearch({ ...heroSearch, category: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-lg bg-theme02-medium-gray border border-theme02-medium-gray/50 text-white focus:outline-none focus:ring-2 focus:ring-theme02-green focus:border-transparent text-base transition-all"
                  >
                    <option value="">Selecione</option>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme02-light-gray mb-2">
                    Valor mínimo
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={heroSearch.minPrice}
                    onChange={(e) => setHeroSearch({ ...heroSearch, minPrice: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-lg bg-theme02-medium-gray border border-theme02-medium-gray/50 text-white placeholder:text-theme02-medium-gray focus:outline-none focus:ring-2 focus:ring-theme02-green focus:border-transparent text-base transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme02-light-gray mb-2">
                    Localização
                  </label>
                  <select
                    value={heroSearch.location}
                    onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-lg bg-theme02-medium-gray border border-theme02-medium-gray/50 text-white focus:outline-none focus:ring-2 focus:ring-theme02-green focus:border-transparent text-base transition-all"
                  >
                    <option value="">Todas as cidades</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <button
                    type="submit"
                    className="w-full bg-theme02-green text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-theme02-green-hover active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Search size={18} />
                    <span>Buscar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Category Filter Section */}
      <section className="py-10 sm:py-14 bg-theme02-black border-b border-theme02-dark-gray">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Busque seu imóvel por categoria
            </h2>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex sm:flex-wrap sm:justify-center gap-3 pb-2 sm:pb-0 min-w-max sm:min-w-0">
              {categoryFilters.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-5 sm:px-6 py-3 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-theme02-green text-white shadow-lg shadow-theme02-green/30'
                        : 'bg-theme02-dark-gray text-theme02-light-gray hover:bg-theme02-medium-gray border border-theme02-medium-gray/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon size={16} />
                      <span className="text-sm sm:text-base">{category.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeCategory === category.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-theme02-medium-gray text-theme02-light-gray'
                      }`}>
                        {category.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12 sm:py-20 bg-theme02-deep-black">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Conheça nossos melhores imóveis
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-theme02-green" />
            </div>
          ) : displayProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
                {displayProperties.map((property) => (
                  <PropertyCardTheme02
                    key={property.id}
                    property={convertToCardFormat(property)}
                    onFavorite={handleFavorite}
                    isFavorited={favorites.includes(property.id)}
                  />
                ))}
              </div>
              <div className="text-center">
                <Link 
                  to="/imoveis" 
                  className="inline-flex items-center space-x-2 bg-theme02-medium-gray text-white px-8 py-3.5 rounded-lg font-medium hover:bg-theme02-green transition-all duration-200 border border-theme02-medium-gray/50"
                >
                  <span>Todos os imóveis</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <HomeIcon size={56} className="mx-auto text-theme02-medium-gray mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum imóvel cadastrado
              </h3>
              <p className="text-theme02-medium-gray">
                Acesse o painel administrativo para adicionar imóveis.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-14 sm:py-20 bg-theme02-black">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Explore as maneiras pelas quais podemos ajudar
            </h2>
            <p className="text-theme02-medium-gray max-w-2xl mx-auto">
              Oferecemos soluções completas para todas as suas necessidades imobiliárias
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-theme02-dark-gray rounded-2xl p-6 sm:p-8 text-center border border-theme02-medium-gray/30 hover:border-theme02-green/30 transition-all duration-300 group">
              <div className="w-16 h-16 bg-theme02-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-theme02-green/20 transition-colors">
                <HomeIcon className="text-theme02-green w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Comprar imóveis</h3>
              <p className="text-theme02-medium-gray mb-6">
                Encontre o imóvel perfeito com nossa expertise e atendimento personalizado.
              </p>
              <Link 
                to="/imoveis" 
                className="inline-block bg-theme02-medium-gray/50 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-theme02-green transition-all duration-200 border border-theme02-medium-gray/30"
              >
                Ver imóveis
              </Link>
            </div>

            <div className="bg-theme02-dark-gray rounded-2xl p-6 sm:p-8 text-center border border-theme02-medium-gray/30 hover:border-theme02-green/30 transition-all duration-300 group">
              <div className="w-16 h-16 bg-theme02-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-theme02-green/20 transition-colors">
                <Building className="text-theme02-green w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Alugar imóveis</h3>
              <p className="text-theme02-medium-gray mb-6">
                Encontre opções de aluguel que se encaixem no seu orçamento e necessidades.
              </p>
              <Link 
                to="/imoveis" 
                className="inline-block bg-theme02-medium-gray/50 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-theme02-green transition-all duration-200 border border-theme02-medium-gray/30"
              >
                Ver aluguéis
              </Link>
            </div>

            <div className="bg-theme02-dark-gray rounded-2xl p-6 sm:p-8 text-center border border-theme02-medium-gray/30 hover:border-theme02-green/30 transition-all duration-300 group sm:col-span-2 md:col-span-1">
              <div className="w-16 h-16 bg-theme02-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-theme02-green/20 transition-colors">
                <Star className="text-theme02-green w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Anuncie seu imóvel</h3>
              <p className="text-theme02-medium-gray mb-6">
                Venda ou alugue seu imóvel com nossa estratégia de marketing eficaz.
              </p>
              <Link 
                to="/contato" 
                className="inline-block bg-theme02-medium-gray/50 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-theme02-green transition-all duration-200 border border-theme02-medium-gray/30"
              >
                Anunciar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Carousel */}
      {featuredProperties.length > 0 && (
        <section className="py-16 sm:py-20 bg-theme02-deep-black">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Imóveis em Destaque
              </h2>
              <p className="text-theme02-medium-gray max-w-2xl mx-auto">
                Conheça alguns dos nossos melhores imóveis selecionados especialmente para você
              </p>
            </div>
            
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {featuredProperties.slice(0, 9).map((property) => (
                    <div key={property.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-3">
                      <PropertyCardTheme02
                        property={convertToCardFormat(property)}
                        onFavorite={handleFavorite}
                        isFavorited={favorites.includes(property.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Navigation */}
              <button
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-theme02-dark-gray hover:bg-theme02-green text-white rounded-full p-3 shadow-xl transition-all duration-200 z-10 border border-theme02-medium-gray/30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-theme02-dark-gray hover:bg-theme02-green text-white rounded-full p-3 shadow-xl transition-all duration-200 z-10 border border-theme02-medium-gray/30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-theme02-green">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <HomeIcon size={36} className="mx-auto mb-3 text-white/90" />
              <div className="text-4xl font-bold text-white mb-1">500+</div>
              <div className="text-sm text-white/80 font-medium">Imóveis Vendidos</div>
            </div>
            <div>
              <Users size={36} className="mx-auto mb-3 text-white/90" />
              <div className="text-4xl font-bold text-white mb-1">1000+</div>
              <div className="text-sm text-white/80 font-medium">Clientes Satisfeitos</div>
            </div>
            <div>
              <Star size={36} className="mx-auto mb-3 text-white/90" />
              <div className="text-4xl font-bold text-white mb-1">10+</div>
              <div className="text-sm text-white/80 font-medium">Anos de Experiência</div>
            </div>
            <div>
              <Trophy size={36} className="mx-auto mb-3 text-white/90" />
              <div className="text-4xl font-bold text-white mb-1">98%</div>
              <div className="text-sm text-white/80 font-medium">Taxa de Sucesso</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-16 sm:py-24 bg-theme02-black">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                A melhor maneira de encontrar
                <br />
                o imóvel <span className="text-theme02-green">perfeito</span> para você
              </h2>
              <p className="text-lg text-theme02-medium-gray mb-8 leading-relaxed">
                {siteConfig?.about_text || 'Com mais de uma década de experiência no mercado imobiliário de Brasília DF, dedico-me a oferecer um atendimento personalizado e encontrar o imóvel perfeito para cada cliente. Especializada em imóveis de alto padrão nas regiões mais valorizadas da capital.'}
              </p>
              
              {/* Stats */}
              <div className="flex gap-10 mb-10">
                <div>
                  <div className="text-3xl font-bold text-theme02-green">500+</div>
                  <div className="text-sm text-theme02-medium-gray mt-1">Vendas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-theme02-green">10+</div>
                  <div className="text-sm text-theme02-medium-gray mt-1">Anos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-theme02-green">98%</div>
                  <div className="text-sm text-theme02-medium-gray mt-1">Satisfação</div>
                </div>
              </div>
              
              <Link 
                to="/sobre" 
                className="inline-block bg-theme02-green text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-theme02-green-hover transition-all duration-200"
              >
                Conhecer Mais
              </Link>
            </div>
            <div className="relative group">
              <div className="aspect-square bg-theme02-dark-gray rounded-2xl overflow-hidden border border-theme02-medium-gray/30">
                {(siteConfig?.home_image_url || siteConfig?.about_image_url) && (
                  <img
                    src={siteConfig?.home_image_url || siteConfig?.about_image_url || ''}
                    alt="Via Fatto Imóveis"
                    className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                    style={{ objectPosition: siteConfig?.home_image_position || '50% 50%' }}
                  />
                )}
              </div>
              {/* CRECI Badge */}
              <div className="absolute -bottom-6 -right-6 bg-theme02-green text-white p-5 rounded-xl shadow-2xl text-center">
                <div className="text-lg font-bold">CRECI-DF</div>
                <div className="text-2xl font-bold">29588</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 bg-theme02-deep-black">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            Pronto para Encontrar Seu Novo Lar?
          </h2>
          <p className="text-lg text-theme02-medium-gray mb-10 max-w-2xl mx-auto">
            Entre em contato e deixe nossa expertise trabalhar para você. Atendimento personalizado e resultados garantidos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/contato" 
              className="bg-theme02-green text-white px-8 py-4 rounded-lg font-semibold hover:bg-theme02-green-hover transition-all duration-200 shadow-lg shadow-theme02-green/20"
            >
              Agendar Consulta
            </Link>
            <Link 
              to="/contato" 
              className="border border-theme02-medium-gray text-white px-8 py-4 rounded-lg font-semibold hover:bg-theme02-dark-gray transition-all duration-200"
            >
              Entrar em Contato
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeTheme02;
