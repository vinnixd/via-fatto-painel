import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/ui/PropertyCard';
import PropertyFilter from '@/components/ui/PropertyFilter';
import { useProperties, useSiteConfig, PropertyFromDB } from '@/hooks/useSupabaseData';
import { PropertyFilter as PropertyFilterType } from '@/types/property';
import { Grid, List, Loader2 } from 'lucide-react';

const PropertiesPage = () => {
  const { data: properties = [], isLoading } = useProperties();
  const { data: siteConfig } = useSiteConfig();
  
  const [filteredProperties, setFilteredProperties] = useState<PropertyFromDB[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilterType>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
    type: property.type,
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
    images: property.images?.map(img => img.url) || ['/placeholder.svg'],
    featured: property.featured,
    financing: property.financing,
    documentation: property.documentation as 'regular' | 'pendente' | 'irregular',
    reference: property.reference || '',
    views: property.views,
    broker: {
      name: 'Via Fatto Imóveis',
      phone: siteConfig?.whatsapp || '11999887766',
      email: siteConfig?.email || 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456',
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8">Todos os Imóveis</h1>
          
          {/* Filters */}
          <div className="mb-8">
            <PropertyFilter
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="text-muted-foreground">
              {filteredProperties.length} imóve{filteredProperties.length !== 1 ? 'is' : 'l'} encontrado{filteredProperties.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
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
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid/List */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : currentProperties.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-6'
            }>
              {currentProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={convertToCardFormat(property)}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.includes(property.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏠</div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Anterior
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === currentPage
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-neutral-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
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
