import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/ui/PropertyCard';
import PropertyFilter from '@/components/ui/PropertyFilter';
import SEOHead from '@/components/SEOHead';
import { useProperties, useSiteConfig, PropertyFromDB } from '@/hooks/useSupabaseData';
import { PropertyFilter as PropertyFilterType } from '@/types/property';
import { Grid, List, Loader2 } from 'lucide-react';

const PropertiesPage = () => {
  const [searchParams] = useSearchParams();
  const { data: properties = [], isLoading } = useProperties();
  const { data: siteConfig } = useSiteConfig();
  
  const [filteredProperties, setFilteredProperties] = useState<PropertyFromDB[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('custom');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Initialize filters from URL params - only once
  const initialFilters = useMemo(() => {
    const filters: PropertyFilterType = {};
    const type = searchParams.get('type');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    if (type) filters.type = type;
    if (location) filters.city = location;
    if (minPrice) filters.minPrice = Number(minPrice.replace(/\D/g, ''));
    if (maxPrice) filters.maxPrice = Number(maxPrice.replace(/\D/g, ''));
    
    return filters;
  }, [searchParams]);

  const [filters, setFilters] = useState<PropertyFilterType>(initialFilters);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Filter and sort properties
  useEffect(() => {
    let filtered = [...properties];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (property.address_neighborhood?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        property.address_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.features?.some(feature => 
          feature.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(property => property.type === filters.type);
    }
    
    if (filters.city) {
      filtered = filtered.filter(property => property.address_city === filters.city);
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

    // Apply sorting
    switch (sortBy) {
      case 'custom':
        // Keep database order (order_index)
        filtered.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'area_asc':
        filtered.sort((a, b) => a.area - b.area);
        break;
      case 'area_desc':
        filtered.sort((a, b) => b.area - a.area);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }

    setFilteredProperties(filtered);
    setCurrentPage(1);
  }, [properties, searchQuery, filters, sortBy]);

  const handleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

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

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  // Scroll to top when page changes (but not on initial load)
  const [hasInteracted, setHasInteracted] = useState(false);
  
  useEffect(() => {
    if (hasInteracted) {
      window.scrollTo(0, 0);
    }
  }, [currentPage, hasInteracted]);

  const handlePageChange = (page: number) => {
    setHasInteracted(true);
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`Imóveis à Venda e Aluguel - ${siteConfig?.seo_title || 'Via Fatto Imóveis'}`}
        description={`Encontre ${filteredProperties.length} imóveis disponíveis para compra e aluguel em Brasília DF e Goiás. Casas, apartamentos, terrenos e mais.`}
        ogImage={siteConfig?.og_image_url || undefined}
        siteConfig={siteConfig}
      />
      <Header />
      
      <main className="py-6 sm:py-8">
        <div className="container">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Todos os Imóveis</h1>
          
          {/* Filters */}
          <div className="mb-6 sm:mb-8">
            <PropertyFilter
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
              initialFilters={filters}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-sm sm:text-base text-muted-foreground">
              {filteredProperties.length} imóve{filteredProperties.length !== 1 ? 'is' : 'l'} encontrado{filteredProperties.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none input-field text-sm sm:text-base !py-2"
              >
                <option value="custom">Personalizada</option>
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="area_asc">Menor área</option>
                <option value="area_desc">Maior área</option>
              </select>

              {/* View Mode */}
              <div className="flex rounded-lg border border-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 sm:p-2 touch-manipulation ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-label="Visualização em grade"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 sm:p-2 touch-manipulation ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-label="Visualização em lista"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid/List */}
          {isLoading ? (
            <div className="flex justify-center py-12 sm:py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : currentProperties.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
              : 'flex flex-col gap-4 sm:gap-6'
            }>
              {currentProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={convertToCardFormat(property)}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.includes(property.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-5xl sm:text-6xl mb-4">🏠</div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                Nenhum imóvel encontrado
              </h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 sm:mt-12">
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 text-sm sm:text-base touch-manipulation"
                >
                  Anterior
                </button>
                
                {/* Show limited pages on mobile */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Smart pagination for mobile
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 sm:w-auto sm:px-4 sm:py-2 rounded-lg touch-manipulation ${
                        pageNum === currentPage
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border hover:bg-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 text-sm sm:text-base touch-manipulation"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertiesPage;
