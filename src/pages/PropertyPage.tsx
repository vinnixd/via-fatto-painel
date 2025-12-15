import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, Printer, MapPin, Bed, Bath, Car, Maximize, CheckCircle, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useProperty, useSiteConfig, useSimilarProperties } from '@/hooks/useSupabaseData';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { buildWhatsAppUrl } from '@/lib/utils';

const PropertyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(slug || '');
  const { data: siteConfig } = useSiteConfig();
  const { data: similarProperties } = useSimilarProperties(property);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const thumbnailsPerPage = 4;

  useEffect(() => {
    if (property) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorited(favorites.includes(property.id));
    }
  }, [property]);

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

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Imóvel não encontrado</h1>
          <button onClick={() => navigate('/')} className="btn-primary">
            Voltar ao Início
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.images && property.images.length > 0 
    ? property.images.map(img => img.url) 
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'];

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) {
      return 'Consulte';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = isFavorited
      ? favorites.filter((id: string) => id !== property.id)
      : [...favorites, property.id];
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  const getWhatsAppUrl = () => {
    const priceText = property.price && property.price > 0 ? ` - ${formatPrice(property.price)}` : '';
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - Ref: ${property.reference || property.id}${priceText}. Poderia me passar mais informações?`;
    return buildWhatsAppUrl({ phone: siteConfig?.whatsapp, message });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Confira este imóvel: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8">
        <div className="container">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Gallery */}
            <div className="lg:col-span-2">
              <div className="relative mb-4">
                <img
                  src={images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-[400px] md:h-[500px] object-cover rounded-xl cursor-pointer"
                  onClick={() => setIsGalleryOpen(true)}
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Carousel */}
              {images.length > 1 && (
                <div className="relative flex items-center gap-2">
                  {/* Left Arrow */}
                  {thumbnailStartIndex > 0 && (
                    <button
                      onClick={() => setThumbnailStartIndex(prev => Math.max(0, prev - 1))}
                      className="flex-shrink-0 bg-muted hover:bg-muted/80 p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  
                  {/* Thumbnails */}
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    {images.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage).map((image, index) => {
                      const actualIndex = thumbnailStartIndex + index;
                      return (
                        <button
                          key={actualIndex}
                          onClick={() => setCurrentImageIndex(actualIndex)}
                          className={`relative aspect-square rounded-lg overflow-hidden ${
                            actualIndex === currentImageIndex ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${property.title} - ${actualIndex + 1}`}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                          />
                          {/* Show +N on last thumbnail if more images exist */}
                          {index === thumbnailsPerPage - 1 && images.length > thumbnailStartIndex + thumbnailsPerPage && (
                            <div 
                              className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsGalleryOpen(true);
                              }}
                            >
                              +{images.length - thumbnailStartIndex - thumbnailsPerPage}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Right Arrow */}
                  {thumbnailStartIndex + thumbnailsPerPage < images.length && (
                    <button
                      onClick={() => setThumbnailStartIndex(prev => Math.min(images.length - thumbnailsPerPage, prev + 1))}
                      className="flex-shrink-0 bg-muted hover:bg-muted/80 p-2 rounded-full transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Description Section - Below Gallery */}
              {property.description && (
                <div className="mt-8 p-6 bg-card rounded-xl border border-border">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Sobre este Imóvel
                  </h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {property.description.split('\n\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index} className="mb-4 leading-relaxed">
                          {paragraph}
                        </p>
                      )
                    ))}
                  </div>
                  
                  {/* Features inline if available */}
                  {property.features && property.features.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="font-semibold mb-3 text-foreground">Destaques do Imóvel</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.features.slice(0, 9).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    property.status === 'venda' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-info text-white'
                  }`}>
                    {property.status === 'venda' ? 'À Venda' : 'Aluguel'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleFavorite}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorited 
                          ? 'bg-red-500 text-white' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-colors"
                    >
                      <Printer size={18} />
                    </button>
                  </div>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin size={16} className="mr-1" />
                  <span>{property.address_neighborhood}, {property.address_city}</span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(property.price)}
                </div>
                
                {/* Condo fee and IPTU */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                  {(property.condo_exempt || (property.condo_fee !== null && property.condo_fee !== undefined)) && (
                    <span>
                      Condomínio: {property.condo_exempt ? 'Isento' : formatPrice(property.condo_fee)}
                    </span>
                  )}
                  {property.iptu !== null && property.iptu !== undefined && property.iptu > 0 && (
                    <span>IPTU: {formatPrice(property.iptu)}/ano</span>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Ref: {property.reference || property.id.substring(0, 8)}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                {property.bedrooms > 0 && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Bed size={20} />
                    <span>{property.bedrooms} quarto{property.bedrooms > 1 ? 's' : ''}</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Bath size={20} />
                    <span>{property.bathrooms} banheiro{property.bathrooms > 1 ? 's' : ''}</span>
                  </div>
                )}
                {property.garages > 0 && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Car size={20} />
                    <span>{property.garages} vaga{property.garages > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Maximize size={20} />
                  <span>{property.area}m²</span>
                </div>
              </div>

              {/* Documentation */}
              <div className="flex items-center space-x-2">
                <CheckCircle size={20} className="text-success" />
                <span className="text-sm">
                  {property.financing ? 'Aceita financiamento' : 'Não aceita financiamento'}
                </span>
              </div>

              {/* Contact */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Contato</h3>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <strong>Via Fatto Imóveis</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    CRECI-DF: 29588 | CRECI-GO: 42119
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {siteConfig?.phone || '(11) 99988-7766'}
                  </div>
                </div>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full text-center flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon size={18} />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl w-full h-[90vh] p-0 bg-black border-0 flex flex-col [&>button]:hidden">
          {/* Close Button */}
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          {/* Main Image Container */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <img
              src={images[currentImageIndex]}
              alt={property.title}
              className="max-h-full max-w-full object-contain"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 md:p-3 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 md:p-3 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          
          {/* Counter */}
          <div className="text-center text-white py-2">
            {currentImageIndex + 1} / {images.length}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 justify-start md:justify-center">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden transition-opacity ${
                    index === currentImageIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${property.title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Similar Properties Section */}
      {similarProperties && similarProperties.length > 0 && (
        <section className="bg-muted py-12">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              Imóveis Semelhantes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((similarProperty) => (
                <Link 
                  key={similarProperty.id} 
                  to={`/imovel/${similarProperty.slug}`}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={similarProperty.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'}
                      alt={similarProperty.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                      similarProperty.status === 'venda' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-info text-white'
                    }`}>
                      {similarProperty.status === 'venda' ? 'Venda' : 'Aluguel'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {similarProperty.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin size={12} />
                      {similarProperty.address_neighborhood}, {similarProperty.address_city}
                    </p>
                    <p className="font-bold text-primary">
                      {similarProperty.price && similarProperty.price > 0
                        ? formatPrice(similarProperty.price)
                        : 'Consulte'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {similarProperty.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed size={12} /> {similarProperty.bedrooms}
                        </span>
                      )}
                      {similarProperty.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath size={12} /> {similarProperty.bathrooms}
                        </span>
                      )}
                      {similarProperty.area > 0 && (
                        <span className="flex items-center gap-1">
                          <Maximize size={12} /> {similarProperty.area}m²
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default PropertyPage;
