import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Users, Home as HomeIcon, Trophy, Search, Building, TreePine, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import PropertyCard from '@/components/ui/PropertyCard';
import { useProperties, useCategories, useSiteConfig, useAvailableCities, PropertyFromDB } from '@/hooks/useSupabaseData';
import heroHouse from '@/assets/hero-house.jpg';

// Preload hero image for faster LCP
const preloadHeroImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
};

const Home = () => {
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

  // Preload hero image for better LCP
  useEffect(() => {
    const heroSrc = siteConfig?.hero_background_url || heroHouse;
    preloadHeroImage(heroSrc);
  }, [siteConfig?.hero_background_url]);

  // Load favorites from localStorage
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

  const displayProperties = filteredProperties.slice(0, 6);
  
  // Carousel for featured properties
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: false },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Convert DB property to card format
  const convertToCardFormat = (property: PropertyFromDB) => ({
    id: property.id,
    title: property.title,
    slug: property.slug,
    description: property.description || '',
    price: property.price,
    status: property.status as 'venda' | 'aluguel',
    type: property.type as 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural',
    profile: property.profile as 'residencial' | 'comercial' | 'industrial' | 'misto',
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
    <div className="min-h-screen bg-background">
      {/* Hero Section with Integrated Search */}
      <section className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        {/* Background Image - Optimized for LCP */}
        <div className="absolute inset-0">
          <img
            src={siteConfig?.hero_background_url || heroHouse}
            alt="Casa moderna"
            className="w-full h-full object-cover opacity-40"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative container py-20">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {siteConfig?.hero_title || 'Encontre o imóvel dos seus sonhos'}
            </h1>
            {siteConfig?.hero_subtitle && (
              <p className="text-xl text-neutral-200">{siteConfig.hero_subtitle}</p>
            )}
          </div>

          {/* Hero Search Form */}
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleHeroSearch} className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-2">
                    Categoria
                  </label>
                  <select
                    value={heroSearch.category}
                    onChange={(e) => setHeroSearch({ ...heroSearch, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-2">
                    Valor mínimo
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={heroSearch.minPrice}
                    onChange={(e) => setHeroSearch({ ...heroSearch, minPrice: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-2">
                    Localização
                  </label>
                  <select
                    value={heroSearch.location}
                    onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todas as cidades</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center space-x-2"
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
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Busque seu imóvel por categoria
            </h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categoryFilters.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={18} />
                    <span>{category.name}</span>
                    <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Conheça nossos melhores imóveis
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : displayProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {displayProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={convertToCardFormat(property)}
                    onFavorite={handleFavorite}
                    isFavorited={favorites.includes(property.id)}
                  />
                ))}
              </div>
              <div className="text-center">
                <Link to="/imoveis" className="btn-primary">
                  Todos os imóveis
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <HomeIcon size={64} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum imóvel cadastrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Acesse o painel administrativo para adicionar imóveis.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Explore as inúmeras maneiras pelas quais podemos ajudar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos soluções completas para todas as suas necessidades imobiliárias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-property text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">Comprar imóveis</h3>
              <p className="text-muted-foreground mb-6">
                Encontre o imóvel perfeito com nossa expertise e atendimento personalizado.
              </p>
              <Link to="/imoveis" className="btn-primary">
                Ver imóveis
              </Link>
            </div>

            <div className="card-property text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">Alugar imóveis</h3>
              <p className="text-muted-foreground mb-6">
                Encontre opções de aluguel que se encaixem no seu orçamento e necessidades.
              </p>
              <Link to="/imoveis" className="btn-primary">
                Ver aluguéis
              </Link>
            </div>

            <div className="card-property text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">Anuncie seu imóvel</h3>
              <p className="text-muted-foreground mb-6">
                Venda ou alugue seu imóvel com nossa estratégia de marketing eficaz.
              </p>
              <Link to="/contato" className="btn-primary">
                Anunciar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Carousel */}
      {featuredProperties.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Imóveis em Destaque
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Conheça alguns dos nossos melhores imóveis selecionados especialmente para você
              </p>
            </div>
            
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {featuredProperties.slice(0, 9).map((property) => (
                    <div key={property.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-3">
                      <PropertyCard
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
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <HomeIcon size={32} className="mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm opacity-90">Imóveis Vendidos</div>
            </div>
            <div>
              <Users size={32} className="mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">1000+</div>
              <div className="text-sm opacity-90">Clientes Satisfeitos</div>
            </div>
            <div>
              <Star size={32} className="mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">10+</div>
              <div className="text-sm opacity-90">Anos de Experiência</div>
            </div>
            <div>
              <Trophy size={32} className="mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm opacity-90">Taxa de Sucesso</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                A melhor maneira de encontrar
                <br />
                o imóvel <span className="text-primary">perfeito</span> para você
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {siteConfig?.about_text || 'Com mais de uma década de experiência no mercado imobiliário de Brasília DF, dedico-me a oferecer um atendimento personalizado e encontrar o imóvel perfeito para cada cliente. Especializada em imóveis de alto padrão nas regiões mais valorizadas da capital.'}
              </p>
              
              {/* Stats */}
              <div className="flex gap-8 mb-8">
                <div>
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Vendas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground">Anos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfação</div>
                </div>
              </div>
              
              <Link to="/sobre" className="btn-primary">
                Conhecer Mais
              </Link>
            </div>
            <div className="relative group">
              <div className="aspect-square bg-neutral-200 rounded-2xl overflow-hidden">
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
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-4 rounded-xl shadow-lg text-center">
                <div className="text-lg font-bold">CRECI-DF</div>
                <div className="text-xl font-bold">29588</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para Encontrar Seu Novo Lar?
          </h2>
          <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
            Entre em contato e deixe nossa expertise trabalhar para você. Atendimento personalizado e resultados garantidos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/contato" className="btn-primary">
              Agendar Consulta
            </Link>
            <Link to="/contato" className="border border-neutral-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
              Entrar em Contato
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
