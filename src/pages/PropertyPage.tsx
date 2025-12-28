import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ArrowLeft, Heart, Share2, Printer, MapPin, Bed, Bath, Car, Maximize, CheckCircle, Loader2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Expand, Grid3X3, Copy, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useProperty, useSiteConfig, useSimilarProperties } from '@/hooks/useSupabaseData';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { buildWhatsAppUrl } from '@/lib/utils';
import PropertyMap from '@/components/ui/PropertyMap';
import SEOHead from '@/components/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { trackWhatsAppClick, trackFavorite, trackPropertyView, trackPropertyShare } from '@/lib/gtmEvents';

const propertyTypeLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Imóvel Comercial',
  rural: 'Imóvel Rural',
  cobertura: 'Cobertura',
  flat: 'Flat',
  galpao: 'Galpão',
  loft: 'Loft',
};

const PropertyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    data: property,
    isLoading,
    isError,
    error,
  } = useProperty(slug || '');
  const { data: siteConfig } = useSiteConfig();
  const { data: similarProperties } = useSimilarProperties(property ?? null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);
  const thumbnailsPerPage = 4;

  // Touch/swipe handling for gallery
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const stickySidebarRef = useRef<HTMLDivElement>(null);

  // Measure header height dynamically
  useEffect(() => {
    const measureHeader = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    measureHeader();
    window.addEventListener('resize', measureHeader);
    return () => window.removeEventListener('resize', measureHeader);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next image
        setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
      } else {
        // Swipe right - previous image
        setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
      }
    }
  };

  // Generate breadcrumb data - hooks must be called before any early returns
  const breadcrumbItems = useMemo(() => {
    if (!property) return [];
    const baseUrl = window.location.origin;
    const items = [{ name: 'Imóveis', url: `${baseUrl}/imoveis` }];

    if (property.address_city) {
      items.push({
        name: property.address_city,
        url: `${baseUrl}/imoveis?city=${encodeURIComponent(property.address_city)}`,
      });
    }

    items.push({ name: property.title, url: window.location.href });

    return items;
  }, [property]);

  const breadcrumbsUI = useMemo(() => {
    if (!property) return [];
    const items: { label: string; href?: string }[] = [{ label: 'Imóveis', href: '/imoveis' }];

    if (property.address_city) {
      items.push({
        label: property.address_city,
        href: `/imoveis?city=${encodeURIComponent(property.address_city)}`,
      });
    }

    const typeLabel = propertyTypeLabels[property.type] || property.type;
    items.push({ label: `${typeLabel} em ${property.address_neighborhood || property.address_city}` });

    return items;
  }, [property]);

  useEffect(() => {
    if (property) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorited(favorites.includes(property.id));
      
      // Track property view
      trackPropertyView(property.id, property.title, property.type, property.price);
    }
  }, [property]);

  // DEV-only: detect ancestor CSS that breaks `position: sticky`
  useEffect(() => {
    if (!(import.meta as any).env?.DEV) return;
    if (!stickySidebarRef.current) return;

    const el = stickySidebarRef.current;
    const blockers: Array<{ reason: string; value: string; node: string }> = [];

    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);

      const overflowX = style.overflowX;
      const overflowY = style.overflowY;
      if (['hidden', 'auto', 'scroll'].includes(overflowX) || ['hidden', 'auto', 'scroll'].includes(overflowY)) {
        blockers.push({
          reason: 'overflow',
          value: `overflowX=${overflowX}, overflowY=${overflowY}`,
          node: node.tagName.toLowerCase() + (node.className ? `.${String(node.className).split(' ').join('.')}` : ''),
        });
      }

      if (style.transform && style.transform !== 'none') {
        blockers.push({ reason: 'transform', value: style.transform, node: node.tagName.toLowerCase() });
      }
      if (style.filter && style.filter !== 'none') {
        blockers.push({ reason: 'filter', value: style.filter, node: node.tagName.toLowerCase() });
      }
      if (style.perspective && style.perspective !== 'none' && style.perspective !== '0px') {
        blockers.push({ reason: 'perspective', value: style.perspective, node: node.tagName.toLowerCase() });
      }

      node = node.parentElement;
    }

    if (blockers.length > 0) {
      console.warn('[StickyAudit] Ancestor CSS pode quebrar o sticky:', blockers);
    }
  }, [property?.id]);

  // Images array - defined early for touch handlers
  const images = useMemo(() => {
    if (!property) return ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'];
    return property.images && property.images.length > 0 
      ? property.images.map(img => img.url) 
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'];
  }, [property]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 sm:py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    console.error('[PropertyPage] failed to load property:', error);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 sm:py-16 text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-3">Não foi possível carregar o imóvel</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Houve um erro ao buscar os dados. Tente recarregar a página.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Recarregar
            </button>
            <button onClick={() => navigate('/imoveis')} className="btn-secondary">
              Ver todos os imóveis
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 sm:py-16 text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Imóvel não encontrado</h1>
          <button onClick={() => navigate('/')} className="btn-primary">
            Voltar ao Início
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) {
      return 'Consulte';
    }
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
    
    // Track favorite action
    trackFavorite(isFavorited ? 'remove' : 'add', property.id, property.title);
  };

  const getWhatsAppUrl = () => {
    const priceText = property.price && property.price > 0 ? ` - ${formatPrice(property.price)}` : '';
    const propertyUrl = `${window.location.origin}/imovel/${property.slug}`;
    const message = `Olá! Tenho interesse no imóvel:\n\n*${property.title}*\nRef: ${property.reference || property.id}${priceText}\n\n${propertyUrl}\n\nPoderia me passar mais informações?`;
    return buildWhatsAppUrl({ phone: siteConfig?.whatsapp, message });
  };

  const getShareUrl = () => {
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/share-property/${property.slug}`;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    trackPropertyShare(property.id, property.title, 'copy');
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Confira este imóvel: ${property.title}`,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    trackPropertyShare(property.id, property.title, 'whatsapp');
    trackWhatsAppClick('property_share', property.id, property.title);
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(`Confira este imóvel: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <SEOHead 
        property={property}
        siteConfig={siteConfig}
        breadcrumbs={breadcrumbItems}
        ogType="product"
      />
      
      <Header />
      
      <main className="py-4 sm:py-8 overflow-visible">
        <div className="container overflow-visible">
          {/* Breadcrumbs - Hidden on mobile */}
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbsUI} className="mb-4" />
          </div>
          
          {/* Back Button */}
          <button
            onClick={() => {
              // Check if there's history to go back to, otherwise go to properties list
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 sm:mb-6 touch-manipulation active:scale-95 transition-transform min-h-[44px] -ml-2 pl-2 pr-4"
          >
            <ArrowLeft size={22} />
            <span className="text-sm sm:text-base font-medium">Voltar</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 overflow-visible">
            {/* Image Gallery */}
            <div className="lg:col-span-2">
              {/* Main Image with Touch Support */}
              <div 
                ref={mainImageRef}
                className="relative mb-3 sm:mb-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-[280px] sm:h-[400px] md:h-[500px] object-cover rounded-lg sm:rounded-xl cursor-pointer select-none"
                  onClick={() => setIsGalleryOpen(true)}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
                
                {/* Watermark Overlay */}
                {siteConfig?.watermark_enabled && siteConfig?.watermark_url && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img 
                      src={siteConfig.watermark_url} 
                      alt="" 
                      style={{
                        maxWidth: `${siteConfig.watermark_size || 50}%`,
                        maxHeight: `${siteConfig.watermark_size || 50}%`,
                        opacity: (siteConfig.watermark_opacity || 40) / 100,
                      }}
                      className="object-contain select-none"
                      draggable={false}
                    />
                  </div>
                )}
                
                {/* Image Navigation - Larger touch targets on mobile */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2.5 sm:p-2 rounded-full transition-colors touch-manipulation"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft size={24} className="sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2.5 sm:p-2 rounded-full transition-colors touch-manipulation"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight size={24} className="sm:w-6 sm:h-6" />
                    </button>
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Carousel - Horizontal scroll on mobile */}
              {images.length > 1 && (
                <div className="relative">
                  {/* Mobile: Horizontal scroll */}
                  <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-2 pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden touch-manipulation ${
                            index === currentImageIndex ? 'ring-2 ring-primary' : 'opacity-70'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${property.title} - ${index + 1}`}
                            className="w-full h-full object-cover select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Desktop: Grid with navigation */}
                  <div className="hidden sm:flex items-center gap-2">
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
                              className="w-full h-full object-cover hover:opacity-80 transition-opacity select-none"
                              onContextMenu={(e) => e.preventDefault()}
                              draggable={false}
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
                </div>
              )}

              {/* Description Section - Below Gallery */}
              {property.description && (
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-card rounded-lg sm:rounded-xl border border-border">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 sm:h-6 bg-primary rounded-full"></span>
                    Sobre este Imóvel
                  </h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground text-sm sm:text-base">
                    {(() => {
                      // Split description into lines and group them
                      const lines = property.description.split('\n').map((l) => l.trim()).filter((l) => l);
                      const elements: ReactNode[] = [];
                      let checkmarkItems: string[] = [];
                      let paragraphBuffer: string[] = [];

                      const flushParagraph = () => {
                        if (paragraphBuffer.length > 0) {
                          elements.push(
                            <p key={`p-${elements.length}`} className="mb-3 sm:mb-4 leading-relaxed">
                              {paragraphBuffer.join(' ')}
                            </p>
                          );
                          paragraphBuffer = [];
                        }
                      };

                      const flushCheckmarks = () => {
                        if (checkmarkItems.length > 0) {
                          elements.push(
                            <ul key={`ul-${elements.length}`} className="mb-3 sm:mb-4 space-y-2 list-none pl-0">
                              {checkmarkItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                  <span>{item.replace(/^[✓✔]\s*/, '')}</span>
                                </li>
                              ))}
                            </ul>
                          );
                          checkmarkItems = [];
                        }
                      };

                      lines.forEach((line) => {
                        const isCheckmark = /^[✓✔]/.test(line);

                        if (isCheckmark) {
                          flushParagraph();

                          // If the AI returned multiple "✓" in the same line, split them into separate items
                          const parts = line.match(/[✓✔]\s*[^✓✔]+/g);
                          if (parts && parts.length > 1) {
                            parts.forEach((p) => checkmarkItems.push(p.trim()));
                          } else {
                            checkmarkItems.push(line);
                          }
                        } else {
                          flushCheckmarks();
                          paragraphBuffer.push(line);
                        }
                      });

                      // Flush remaining items
                      flushParagraph();
                      flushCheckmarks();

                      return elements;
                    })()}
                  </div>

                  {/* Map Section */}
                  {property.location_type !== 'hidden' && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                      <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm sm:text-base">
                        <MapPin className="h-4 w-4 text-primary" />
                        Localização
                      </h3>
                      <PropertyMap
                        address={`${property.address_street || ''} ${property.address_neighborhood || ''}, ${property.address_city}, ${property.address_state}, Brasil`}
                        zipcode={property.address_zipcode || undefined}
                        locationType={property.location_type as 'exact' | 'approximate' | 'hidden'}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Property Info (Sidebar) */}
            <div 
              ref={stickySidebarRef} 
              className="lg:sticky lg:self-start"
              style={{ top: headerHeight + 16 }}
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="bg-card p-4 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-border">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      property.status === 'venda' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-info text-white'
                    }`}>
                      {property.status === 'venda' ? 'À Venda' : 'Aluguel'}
                    </span>
                    <div className="flex space-x-1.5 sm:space-x-2">
                      <button
                        onClick={handleFavorite}
                        className={`p-2.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
                          isFavorited 
                            ? 'bg-red-500 text-white' 
                            : 'bg-neutral-100 text-neutral-600 hover:bg-red-500 hover:text-white'
                        }`}
                        aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={handleShareWhatsApp}
                        className="p-2.5 sm:p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors touch-manipulation"
                        aria-label="Compartilhar no WhatsApp"
                        title="Compartilhar no WhatsApp"
                      >
                        <WhatsAppIcon size={18} />
                      </button>
                      <button
                        onClick={handleShare}
                        className={`p-2.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
                          shareCopied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white'
                        }`}
                        aria-label={shareCopied ? 'Link copiado!' : 'Copiar link'}
                        title={shareCopied ? 'Link copiado!' : 'Copiar link de compartilhamento'}
                      >
                        {shareCopied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="hidden sm:block p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-colors"
                        aria-label="Imprimir"
                      >
                        <Printer size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground mb-3 sm:mb-4">
                    <MapPin size={14} className="mr-1 flex-shrink-0 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base truncate">{property.address_neighborhood}, {property.address_city}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                    {formatPrice(property.price)}
                  </div>
                  
                  {/* Condo fee and IPTU */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                    {(property.condo_exempt || (property.condo_fee !== null && property.condo_fee !== undefined)) && (
                      <span>
                        Condomínio: {property.condo_exempt ? 'Isento' : formatPrice(property.condo_fee)}
                      </span>
                    )}
                    {property.iptu !== null && property.iptu !== undefined && property.iptu > 0 && (
                      <span>IPTU: {formatPrice(property.iptu)}/ano</span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Ref: {property.reference || property.id.substring(0, 8)}
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-card p-4 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-border">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm sm:text-base">
                      <Bed size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>{property.bedrooms} quarto{property.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm sm:text-base">
                      <Bath size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>{property.bathrooms} banheiro{property.bathrooms > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {property.garages > 0 && (
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm sm:text-base">
                      <Car size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>{property.garages} vaga{property.garages > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm sm:text-base">
                    <Maximize size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{property.area}m²</span>
                  </div>
                </div>

                {/* Características as tags */}
                {property.features && property.features.length > 0 && (
                  <div className="bg-card p-4 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-border">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Características</h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {property.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-primary text-primary rounded-full hover:bg-primary/10 transition-colors"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financing - Only show when enabled */}
                {property.financing && (
                  <div className="flex items-center space-x-2 bg-card p-4 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-border">
                    <CheckCircle size={18} className="text-success sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">Aceita financiamento</span>
                  </div>
                )}

                {/* Contact - Fixed on mobile */}
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Contato</h3>
                  <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="text-sm">
                      <strong>Via Fatto Imóveis</strong>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      CRECI-DF: 29588 | CRECI-GO: 42119
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
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
                    <span className="text-sm sm:text-base">Falar no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating WhatsApp button on mobile */}
      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary-hover transition-colors touch-manipulation"
        aria-label="Falar no WhatsApp"
      >
        <WhatsAppIcon size={24} />
      </a>

      {/* Gallery Modal - Fullscreen with touch support */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-0 flex flex-col [&>button]:hidden rounded-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 z-50 safe-area-top">
            {/* Counter - Left */}
            <div className="text-white text-sm font-medium">
              {currentImageIndex + 1} / {images.length}
            </div>
            
            {/* Toolbar - Right */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={handleShare}
                className="p-2.5 sm:p-2 text-white/70 hover:text-white transition-colors touch-manipulation"
                title="Compartilhar"
              >
                <Share2 size={20} />
              </button>
              <button
                className="hidden sm:block p-2 text-white/70 hover:text-white transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut size={20} />
              </button>
              <button
                className="hidden sm:block p-2 text-white/70 hover:text-white transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn size={20} />
              </button>
              <button
                className="hidden sm:block p-2 text-white/70 hover:text-white transition-colors"
                title="Tela cheia"
              >
                <Expand size={20} />
              </button>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="p-2.5 sm:p-2 text-white/70 hover:text-white transition-colors touch-manipulation"
                title="Fechar"
              >
                <X size={22} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          {/* Main Image Container with touch support */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[currentImageIndex]}
              alt={property.title}
              className="max-h-full max-w-full object-contain select-none"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
            
            {/* Watermark Overlay in Gallery Modal */}
            {siteConfig?.watermark_enabled && siteConfig?.watermark_url && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img 
                  src={siteConfig.watermark_url} 
                  alt="" 
                  style={{
                    maxWidth: `${(siteConfig.watermark_size || 50) * 0.8}%`,
                    maxHeight: `${(siteConfig.watermark_size || 50) * 0.8}%`,
                    opacity: (siteConfig.watermark_opacity || 40) / 100,
                  }}
                  className="object-contain select-none"
                  draggable={false}
                />
              </div>
            )}
            
            {/* Navigation Arrows - Hidden on mobile (use swipe) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 transition-colors"
                >
                  <ChevronLeft size={40} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 transition-colors"
                >
                  <ChevronRight size={40} strokeWidth={1.5} />
                </button>
              </>
            )}
            
            {/* Swipe hint for mobile */}
            <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
              Deslize para navegar
            </div>
          </div>
          
          {/* Thumbnails Strip - Bottom */}
          {images.length > 1 && (
            <div className="relative border-t border-white/10 safe-area-bottom">
              <div className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-14 h-10 sm:w-20 sm:h-14 overflow-hidden transition-all touch-manipulation ${
                      index === currentImageIndex 
                        ? 'ring-2 ring-primary opacity-100' 
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${property.title} - ${index + 1}`}
                      className="w-full h-full object-cover select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
              
              {/* Grid View Button */}
              <button
                className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors bg-black/50 rounded"
                title="Ver em grade"
              >
                <Grid3X3 size={20} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Similar Properties Section */}
      {similarProperties && similarProperties.length > 0 && (
        <section className="bg-muted py-8 sm:py-12">
          <div className="container">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-1 h-5 sm:h-6 bg-primary rounded-full"></span>
              Imóveis Semelhantes
            </h2>
            
            {/* Mobile: Horizontal scroll / Desktop: Grid */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                {similarProperties.map((similarProperty) => (
                  <Link 
                    key={similarProperty.id} 
                    to={`/imovel/${similarProperty.slug}`}
                    className="flex-shrink-0 w-[260px] group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={similarProperty.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'}
                        alt={similarProperty.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                      {/* Watermark Overlay */}
                      {siteConfig?.watermark_enabled && siteConfig?.watermark_url && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <img 
                            src={siteConfig.watermark_url} 
                            alt="" 
                            style={{
                              maxWidth: `${siteConfig.watermark_size || 50}%`,
                              maxHeight: `${siteConfig.watermark_size || 50}%`,
                              opacity: (siteConfig.watermark_opacity || 40) / 100,
                            }}
                            className="object-contain select-none"
                            draggable={false}
                          />
                        </div>
                      )}
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        similarProperty.status === 'venda' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-info text-white'
                      }`}>
                        {similarProperty.status === 'venda' ? 'Venda' : 'Aluguel'}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {similarProperty.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {similarProperty.address_neighborhood}, {similarProperty.address_city}
                      </p>
                      <p className="font-bold text-primary text-sm">
                        {similarProperty.price && similarProperty.price > 0
                          ? formatPrice(similarProperty.price)
                          : 'Consulte'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        {similarProperty.bedrooms > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Bed size={10} /> {similarProperty.bedrooms}
                          </span>
                        )}
                        {similarProperty.bathrooms > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Bath size={10} /> {similarProperty.bathrooms}
                          </span>
                        )}
                        {similarProperty.area > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Maximize size={10} /> {similarProperty.area}m²
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />
                    {/* Watermark Overlay */}
                    {siteConfig?.watermark_enabled && siteConfig?.watermark_url && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img 
                          src={siteConfig.watermark_url} 
                          alt="" 
                          style={{
                            maxWidth: `${siteConfig.watermark_size || 50}%`,
                            maxHeight: `${siteConfig.watermark_size || 50}%`,
                            opacity: (siteConfig.watermark_opacity || 40) / 100,
                          }}
                          className="object-contain select-none"
                          draggable={false}
                        />
                      </div>
                    )}
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