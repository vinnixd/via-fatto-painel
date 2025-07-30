import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Home as HomeIcon, Trophy } from 'lucide-react';
import PropertyCard from '@/components/ui/PropertyCard';
import PropertyFilter from '@/components/ui/PropertyFilter';
import { mockProperties } from '@/data/mockProperties';
import { Property, PropertyFilter as PropertyFilterType } from '@/types/property';

const Home = () => {
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilterType>({});
  const [favorites, setFavorites] = useState<string[]>([]);

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

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(property => property.type === filters.type);
    }
    
    if (filters.city) {
      filtered = filtered.filter(property => property.address.city === filters.city);
    }
    
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= filters.maxPrice!);
    }
    
    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms >= filters.bedrooms!);
    }
    
    if (filters.suites) {
      filtered = filtered.filter(property => property.suites >= filters.suites!);
    }
    
    if (filters.garages) {
      filtered = filtered.filter(property => property.garages >= filters.garages!);
    }
    
    if (filters.minArea) {
      filtered = filtered.filter(property => property.area >= filters.minArea!);
    }
    
    if (filters.maxArea) {
      filtered = filtered.filter(property => property.area <= filters.maxArea!);
    }

    setFilteredProperties(filtered);
  }, [searchQuery, filters]);

  const handleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const featuredProperties = mockProperties.filter(property => property.featured);
  const displayProperties = filteredProperties.length > 0 ? filteredProperties.slice(0, 6) : featuredProperties;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 text-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encontre o Imóvel dos
              <span className="text-primary block">Seus Sonhos</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              Especializada em imóveis de alto padrão em São Paulo. 
              Mais de 10 anos conectando pessoas aos seus lares ideais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/imoveis" className="btn-primary inline-flex items-center space-x-2">
                <HomeIcon size={20} />
                <span>Ver Todos os Imóveis</span>
                <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/5511999887766?text=Olá! Gostaria de saber mais sobre os imóveis disponíveis."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary border-white text-white hover:bg-white hover:text-neutral-900"
              >
                Falar com a Corretora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Encontre Seu Imóvel Ideal
            </h2>
            <PropertyFilter
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
            />
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              Imóveis em Destaque
            </h2>
            <Link 
              to="/imoveis" 
              className="text-primary hover:text-primary-hover font-medium inline-flex items-center space-x-1"
            >
              <span>Ver todos</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.includes(property.id)}
                />
              ))}
            </div>
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
                }}
                className="btn-primary"
              >
                Limpar Filtros
              </button>
            </div>
          )}
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
                Sibele Santos
                <span className="block text-lg font-normal text-muted-foreground mt-2">
                  CRECI-SP 123456
                </span>
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
              <Link to="/sobre" className="btn-secondary">
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