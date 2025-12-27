import { Heart, Bed, Bath, Car, Maximize, MapPin } from 'lucide-react';
import { Property } from '@/types/property';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { buildWhatsAppUrl } from '@/lib/utils';
import { useSiteConfig } from '@/hooks/useSupabaseData';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorited?: boolean;
  viewMode?: 'grid' | 'list';
}

const PropertyCard = ({ property, onFavorite, isFavorited = false, viewMode = 'grid' }: PropertyCardProps) => {
  const [imageError, setImageError] = useState(false);
  const { data: siteConfig } = useSiteConfig();

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

  const coverImage = imageError ? '/placeholder.svg' : (property.images?.[0] || '/placeholder.svg');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const priceText = property.price && property.price > 0 ? ` - ${formatPrice(property.price)}` : '';
    const propertyUrl = `${window.location.origin}/imovel/${property.slug}`;
    const message = `Olá! Tenho interesse no imóvel:\n\n*${property.title}*\nRef: ${property.reference}${priceText}\n\n${propertyUrl}\n\nPoderia me passar mais informações?`;
    const url = buildWhatsAppUrl({ phone: property.broker.phone, message });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // List View Layout
  if (viewMode === 'list') {
    return (
      <Link 
        to={`/imovel/${property.slug}`} 
        className="card-property group block touch-manipulation"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image Container */}
          <div className="relative w-full sm:w-72 md:w-80 lg:w-96 h-48 sm:h-52 flex-shrink-0 overflow-hidden bg-neutral-100">
            <img
              src={coverImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              loading="lazy"
              decoding="async"
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

            {/* Status Badge */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                property.status === 'venda'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-info text-white'
              }`}>
                {property.status === 'venda' ? 'À Venda' : 'Aluguel'}
              </span>
            </div>

            {/* Featured Badge */}
            {property.featured && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                <span className="bg-warning text-white px-2 py-1 rounded-full text-xs font-medium">
                  Destaque
                </span>
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className={`absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-2.5 sm:p-2 rounded-full transition-colors touch-manipulation active:scale-95 ${
                isFavorited
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-neutral-600 hover:bg-red-500 hover:text-white'
              }`}
              aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>

            {/* Reference */}
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              Ref: {property.reference}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col">
            {/* Price */}
            <div className="mb-2">
              <span className="text-base sm:text-lg font-semibold text-foreground">
                {formatPrice(property.price)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center text-muted-foreground mb-3">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="text-sm">
                {property.address.neighborhood}, {property.address.city} - {property.address.state}
              </span>
            </div>

            {/* Description (only in list view) */}
            {property.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 hidden sm:block">
                {property.description}
              </p>
            )}

            {/* Spacer to push features to bottom */}
            <div className="flex-1" />

            {/* Features */}
            <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground pt-3 border-t border-border">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-1.5">
                  <Bed size={16} className="flex-shrink-0" />
                  <span>{property.bedrooms} quarto{property.bedrooms > 1 ? 's' : ''}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-1.5">
                  <Bath size={16} className="flex-shrink-0" />
                  <span>{property.bathrooms} banheiro{property.bathrooms > 1 ? 's' : ''}</span>
                </div>
              )}
              {property.garages > 0 && (
                <div className="flex items-center gap-1.5">
                  <Car size={16} className="flex-shrink-0" />
                  <span>{property.garages} vaga{property.garages > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Maximize size={16} className="flex-shrink-0" />
                <span>{property.area}m²</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid View Layout (default)
  return (
    <Link to={`/imovel/${property.slug}`} className="card-property group block h-full flex flex-col touch-manipulation">
      {/* Image Container */}
      <div className="relative h-44 sm:h-48 md:h-56 overflow-hidden bg-neutral-100">
        <img
          src={coverImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
          loading="lazy"
          decoding="async"
          width={400}
          height={224}
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

        {/* Status Badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
            property.status === 'venda'
              ? 'bg-primary text-primary-foreground'
              : 'bg-info text-white'
          }`}>
            {property.status === 'venda' ? 'À Venda' : 'Aluguel'}
          </span>
        </div>

        {/* Featured Badge */}
        {property.featured && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <span className="bg-warning text-white px-2 py-1 rounded-full text-xs font-medium">
              Destaque
            </span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-2.5 sm:p-2 rounded-full transition-colors touch-manipulation active:scale-95 ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-neutral-600 hover:bg-red-500 hover:text-white'
          }`}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        {/* Reference */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          Ref: {property.reference}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Price */}
        <div className="mb-1.5 sm:mb-2">
          <span className="text-base sm:text-lg font-semibold text-foreground">
            {formatPrice(property.price)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-2 sm:mb-3">
          <MapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">
            {property.address.neighborhood}, {property.address.city}
          </span>
        </div>

        {/* Spacer to push features to bottom */}
        <div className="flex-1" />

        {/* Features - Fixed at footer */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground pt-2 sm:pt-3 border-t border-border">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed size={14} className="flex-shrink-0" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={14} className="flex-shrink-0" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.garages > 0 && (
            <div className="flex items-center gap-1">
              <Car size={14} className="flex-shrink-0" />
              <span>{property.garages}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize size={14} className="flex-shrink-0" />
            <span>{property.area}m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;