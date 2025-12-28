import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { MapPin, Home as HomeIcon, ChevronRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useProperties, useSiteConfig, useAvailableCities } from '@/hooks/useSupabaseData';
import PropertyCard from '@/components/ui/PropertyCard';
import SEOHead from '@/components/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { generateLocationTitle, generateLocationDescription } from '@/lib/seo';

const propertyTypeLabels: Record<string, string> = {
  casa: 'Casas',
  apartamento: 'Apartamentos',
  terreno: 'Terrenos',
  comercial: 'Imóveis Comerciais',
  rural: 'Imóveis Rurais',
  cobertura: 'Coberturas',
  flat: 'Flats',
  galpao: 'Galpões',
};

const statusLabels: Record<string, string> = {
  venda: 'à Venda',
  aluguel: 'para Alugar',
};

export default function LocationPage() {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city') || '';
  const neighborhood = searchParams.get('bairro') || '';
  const type = searchParams.get('tipo') || '';
  const status = searchParams.get('status') || '';
  
  const { data: properties, isLoading } = useProperties();
  const { data: siteConfig } = useSiteConfig();
  const { data: availableCities } = useAvailableCities();

  // Filter properties based on location
  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    
    return properties.filter(p => {
      if (city && p.address_city.toLowerCase() !== city.toLowerCase()) return false;
      if (neighborhood && p.address_neighborhood?.toLowerCase() !== neighborhood.toLowerCase()) return false;
      if (type && p.type !== type) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [properties, city, neighborhood, type, status]);

  // Get unique neighborhoods for current city
  const neighborhoods = useMemo(() => {
    if (!properties || !city) return [];
    
    const cityProperties = properties.filter(
      p => p.address_city.toLowerCase() === city.toLowerCase()
    );
    
    return [...new Set(cityProperties.map(p => p.address_neighborhood).filter(Boolean))]
      .sort((a, b) => (a || '').localeCompare(b || '', 'pt-BR'));
  }, [properties, city]);

  // Get state from first property
  const state = filteredProperties[0]?.address_state || 'GO';

  // Generate SEO data
  const seoTitle = generateLocationTitle(city || 'Brasil', state, neighborhood || undefined, type || undefined, status || undefined);
  const seoDescription = generateLocationDescription(
    city || 'Brasil',
    state,
    filteredProperties.length,
    neighborhood || undefined,
    type || undefined,
    status || undefined
  );

  // Breadcrumbs
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; href?: string }[] = [
      { label: 'Imóveis', href: '/imoveis' },
    ];
    
    if (city) {
      items.push({ label: city, href: `/imoveis/localizacao?city=${encodeURIComponent(city)}` });
    }
    
    if (neighborhood) {
      items.push({ label: neighborhood });
    }
    
    return items;
  }, [city, neighborhood]);

  // Generate content for the page (300+ words for SEO)
  const locationContent = useMemo(() => {
    if (!city) return null;
    
    const typeLabel = type ? propertyTypeLabels[type]?.toLowerCase() : 'imóveis';
    const statusLabel = status ? statusLabels[status]?.toLowerCase() : '';
    
    return `
      Descubra os melhores ${typeLabel} ${statusLabel} em ${city}, ${state}. 
      Nossa seleção inclui opções para todos os perfis, desde ${typeLabel} compactos até propriedades de alto padrão.
      
      ${city} é uma cidade que oferece excelente qualidade de vida, com infraestrutura completa, 
      comércio diversificado e fácil acesso às principais vias da região. 
      O mercado imobiliário local está em constante valorização, tornando este o momento ideal para investir.
      
      ${neighborhood ? `O bairro ${neighborhood} se destaca pela localização privilegiada, 
      segurança e proximidade com serviços essenciais como escolas, hospitais e centros comerciais.` : ''}
      
      Temos atualmente ${filteredProperties.length} ${typeLabel} disponíveis ${statusLabel} em ${city}.
      Todos os imóveis passam por rigorosa análise de documentação e são apresentados com fotos reais e informações detalhadas.
      
      A Via Fatto Imóveis é especializada no mercado imobiliário de Brasília DF e Goiás, 
      oferecendo atendimento personalizado para ajudá-lo a encontrar o imóvel ideal. 
      Nossa equipe de corretores está à disposição para agendar visitas e esclarecer todas as suas dúvidas.
      
      Entre em contato conosco e descubra as melhores oportunidades em ${city}!
    `.trim();
  }, [city, state, neighborhood, type, status, filteredProperties.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        siteConfig={siteConfig}
        breadcrumbs={breadcrumbItems.map(item => ({
          name: item.label,
          url: item.href ? `${window.location.origin}${item.href}` : window.location.href,
        }))}
      />
      
      <Header />
      
      <main className="py-8">
        <div className="container">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {type ? propertyTypeLabels[type] : 'Imóveis'} {status && statusLabels[status]} em {city || 'todas as cidades'}
              {neighborhood && ` - ${neighborhood}`}
            </h1>
            <p className="text-muted-foreground">
              {filteredProperties.length} imóveis encontrados
            </p>
          </div>

          {/* Quick Filters - Cities */}
          {!city && availableCities && availableCities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Buscar por Cidade
              </h2>
              <div className="flex flex-wrap gap-2">
                {availableCities.map((c) => (
                  <Link
                    key={c}
                    to={`/imoveis/localizacao?city=${encodeURIComponent(c)}`}
                    className="px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters - Neighborhoods */}
          {city && neighborhoods.length > 0 && !neighborhood && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-primary" />
                Bairros em {city}
              </h2>
              <div className="flex flex-wrap gap-2">
                {neighborhoods.map((n) => (
                  <Link
                    key={n}
                    to={`/imoveis/localizacao?city=${encodeURIComponent(city)}&bairro=${encodeURIComponent(n || '')}`}
                    className="px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {n}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Type Filters */}
          {!type && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Filtrar por Tipo</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(propertyTypeLabels).map(([key, label]) => (
                  <Link
                    key={key}
                    to={`/imoveis/localizacao?${city ? `city=${encodeURIComponent(city)}&` : ''}tipo=${key}`}
                    className="px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={{
                    id: property.id,
                    title: property.title,
                    slug: property.slug,
                    price: property.price,
                    type: property.type as 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural',
                    status: property.status as 'venda' | 'aluguel' | 'vendido' | 'alugado',
                    condition: property.condition || undefined,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    garages: property.garages,
                    area: property.area,
                    featured: property.featured,
                    address: {
                      street: property.address_street || '',
                      neighborhood: property.address_neighborhood || '',
                      city: property.address_city,
                      state: property.address_state,
                      zipCode: property.address_zipcode || '',
                    },
                    images: property.images?.map((img) => img.url) || [],
                    reference: property.reference || '',
                    description: property.description || '',
                    suites: property.suites,
                    builtArea: property.built_area || undefined,
                    features: property.features || [],
                    amenities: property.amenities || [],
                    financing: property.financing,
                    documentation: property.documentation as 'regular' | 'irregular' | 'pendente',
                    profile: property.profile as 'residencial' | 'comercial' | 'industrial' | 'misto',
                    createdAt: property.created_at,
                    updatedAt: property.updated_at,
                    views: property.views,
                    broker: {
                      name: 'Via Fatto Imóveis',
                      phone: '',
                      email: '',
                      creci: 'CRECI-DF: 29588',
                    },
                  }}
                  isFavorited={false}
                  onFavorite={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não encontramos imóveis com os filtros selecionados.
              </p>
              <Link to="/imoveis" className="btn-primary">
                Ver todos os imóveis
              </Link>
            </div>
          )}

          {/* SEO Content */}
          {locationContent && (
            <div className="mt-12 p-8 bg-card rounded-xl border border-border">
              <h2 className="text-2xl font-bold mb-4">
                Sobre Imóveis em {city}
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {locationContent.split('\n\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
