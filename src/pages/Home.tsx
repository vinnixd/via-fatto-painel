import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Home as HomeIcon, Trophy, Search, Building, TreePine, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import PropertyCard from '@/components/ui/PropertyCard';
import { mockProperties } from '@/data/mockProperties';
import { Property, PropertyFilter as PropertyFilterType } from '@/types/property';
import heroHouse from '@/assets/hero-house.jpg';

const Home = () => {
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilterType>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [heroSearch, setHeroSearch] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    location: ''
  });

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = [...mockProperties];

    // Apply category filter
    if (activeCategory !== 'all') {
      if (activeCategory === 'residencial') {
        filtered = filtered.filter(property => property.type === 'casa' || property.type === 'apartamento');
      } else if (activeCategory === 'comercial') {
        filtered = filtered.filter(property => property.type === 'comercial');
      } else if (activeCategory === 'terrenos') {
        filtered = filtered.filter(property => property.type === 'terreno');
      }
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.features.some(feature => 
          feature.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredProperties(filtered);
  }, [searchQuery, activeCategory]);

  const handleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Apply hero search filters
    const newFilters: PropertyFilterType = {};
    
    if (heroSearch.category) {
      newFilters.type = heroSearch.category;
    }
    
    if (heroSearch.minPrice) {
      newFilters.minPrice = Number(heroSearch.minPrice.replace(/\D/g, ''));
    }
    
    if (heroSearch.maxPrice) {
      newFilters.maxPrice = Number(heroSearch.maxPrice.replace(/\D/g, ''));
    }
    
    if (heroSearch.location) {
      newFilters.city = heroSearch.location;
    }
    
    setFilters(newFilters);
    setSearchQuery(heroSearch.location);
  };

  const categories = [
    { id: 'all', name: 'TODOS', icon: HomeIcon, count: mockProperties.length },
    { id: 'residencial', name: 'RESIDENCIAL', icon: HomeIcon, count: mockProperties.filter(p => p.type === 'casa' || p.type === 'apartamento').length },
    { id: 'comercial', name: 'COMERCIAL', icon: Building, count: mockProperties.filter(p => p.type === 'comercial').length },
    { id: 'terrenos', name: 'TERRENOS', icon: TreePine, count: mockProperties.filter(p => p.type === 'terreno').length },
  ];

  const featuredProperties = mockProperties.filter(property => property.featured);
  const displayProperties = filteredProperties.length > 0 ? filteredProperties.slice(0, 6) : featuredProperties;
  
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Integrated Search */}
      <section className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroHouse}
            alt="Casa moderna"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative container py-20">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encontre o <span className="text-primary">imóvel</span> dos
              <span className="block">seus sonhos com a Sibele Imóveis</span>
            </h1>
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
                  <input
                    type="text"
                    placeholder="Cidade, bairro..."
                    value={heroSearch.location}
                    onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
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
            {categories.map((category) => {
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

          {displayProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {displayProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
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
                Nenhum imóvel encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Tente ajustar os filtros ou entre em contato conosco para mais opções.
              </p>
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="btn-primary"
              >
                Limpar Filtros
              </button>
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
                {featuredProperties.slice(0, 9).map((property, index) => (
                  <div key={property.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-3">
                    <PropertyCard
                      property={property}
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
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                A melhor maneira de encontrar
                <br />
                o imóvel <span className="text-primary">perfeito</span> para você
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Com mais de uma década de experiência no mercado imobiliário de São Paulo, 
                dedico-me a oferecer um atendimento personalizado e encontrar o imóvel 
                perfeito para cada cliente. Especializada em imóveis de alto padrão 
                nas regiões mais valorizadas da capital.
              </p>
              <div className="flex items-center space-x-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Vendas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground">Anos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfação</div>
                </div>
              </div>
              <Link to="/sobre" className="btn-primary">
                Conhecer Mais
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square bg-neutral-200 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=face"
                  alt="Sibele Santos"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-bold">CRECI-SP</div>
                  <div className="text-sm">123456</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-900 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para Encontrar Seu Novo Lar?
          </h2>
          <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            Entre em contato e deixe nossa expertise trabalhar para você. 
            Atendimento personalizado e resultados garantidos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999887766?text=Olá! Gostaria de agendar uma consulta sobre imóveis."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Agendar Consulta
            </a>
            <Link to="/contato" className="btn-secondary border-white text-white hover:bg-white hover:text-neutral-900">
              Outros Contatos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;