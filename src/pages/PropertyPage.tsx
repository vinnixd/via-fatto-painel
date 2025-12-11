import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, Printer, MapPin, Bed, Bath, Car, Maximize, CheckCircle, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useProperty, useSiteConfig } from '@/hooks/useSupabaseData';

const PropertyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(slug || '');
  const { data: siteConfig } = useSiteConfig();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

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

  const images = property.images?.map(img => img.url) || ['/placeholder.svg'];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    const phone = siteConfig?.whatsapp?.replace(/\D/g, '') || '5511999887766';
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - Ref: ${property.reference || property.id} - ${formatPrice(property.price)}. Poderia me passar mais informações?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
                  className="w-full h-[400px] md:h-[500px] object-cover rounded-xl"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden ${
                        index === currentImageIndex ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${property.title} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                          +{images.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
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

              {/* Description */}
              {property.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Características</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, index) => (
                      <span key={index} className="badge-feature">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                    CRECI-SP 123456
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {siteConfig?.phone || '(11) 99988-7766'}
                  </div>
                </div>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full text-center block"
                >
                  Falar no WhatsApp
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

export default PropertyPage;
