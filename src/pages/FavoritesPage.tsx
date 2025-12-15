import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/ui/PropertyCard';
import { useProperties, useSiteConfig, PropertyFromDB } from '@/hooks/useSupabaseData';
import { Heart, Home, Loader2 } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/utils';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { data: allProperties = [], isLoading } = useProperties();
  const { data: siteConfig } = useSiteConfig();

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Filter properties that are in favorites
  const favoriteProperties = allProperties.filter(property => 
    favorites.includes(property.id)
  );

  const handleFavorite = (propertyId: string) => {
    const newFavorites = favorites.filter(id => id !== propertyId);
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const clearAllFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('favorites');
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
                  <Heart className="mr-3 text-red-500" size={32} fill="currentColor" />
                  Meus Favoritos
                </h1>
                <p className="text-muted-foreground">
                  {favoriteProperties.length} imóve{favoriteProperties.length !== 1 ? 'is' : 'l'} salvo{favoriteProperties.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {favoriteProperties.length > 0 && (
                <button
                  onClick={clearAllFavorites}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                >
                  Limpar Todos
                </button>
              )}
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : favoriteProperties.length > 0 ? (
              <>
                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {favoriteProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={convertToCardFormat(property)}
                      onFavorite={handleFavorite}
                      isFavorited={true}
                    />
                  ))}
                </div>

                {/* Additional Actions */}
                <div className="bg-neutral-50 rounded-xl p-8 text-center">
                  <h2 className="text-xl font-bold mb-4">
                    Encontrou o que procurava?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Entre em contato para agendar visitas ou obter mais informações 
                    sobre os imóveis salvos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href={buildWhatsAppUrl({
                        phone: siteConfig?.whatsapp,
                        message: 'Olá! Gostaria de agendar visitas aos imóveis que favoritei.',
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Agendar Visitas
                    </a>
                    <Link to="/contato" className="btn-secondary">
                      Falar com Corretora
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <Heart size={64} className="mx-auto mb-6 text-neutral-300" />
                  <h2 className="text-2xl font-bold mb-4">
                    Nenhum favorito ainda
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Explore nossos imóveis e clique no ícone de coração 
                    para salvar seus favoritos aqui.
                  </p>
                  
                  <div className="space-y-4">
                    <Link to="/imoveis" className="btn-primary block">
                      Explorar Imóveis
                    </Link>
                    <Link to="/" className="btn-secondary block">
                      Voltar ao Início
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-16 bg-primary/5 rounded-xl p-6">
              <h3 className="font-bold mb-3 flex items-center">
                <Home className="mr-2 text-primary" size={20} />
                Dicas dos Favoritos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  • Compare características entre os imóveis salvos
                </div>
                <div>
                  • Agende visitas para os mais interessantes
                </div>
                <div>
                  • Compartilhe a lista com familiares
                </div>
                <div>
                  • Use como base para negociação
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;
