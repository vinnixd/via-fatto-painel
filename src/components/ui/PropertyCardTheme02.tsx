import { Heart, Bed, Bath, Car, Maximize, MapPin } from 'lucide-react';
import { Property } from '@/types/property';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useSiteConfig } from '@/hooks/useSupabaseData';

interface PropertyCardTheme02Props {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorited?: boolean;
  viewMode?: 'grid' | 'list';
}

const PropertyCardTheme02 = ({ property, onFavorite, isFavorited = false, viewMode = 'grid' }: PropertyCardTheme02Props) => {
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

  const getPropertyTag = () => {
    if (!property.condition) return null;
    const conditionMap: Record<string, { label: string; color: string }> = {
      lancamento: { label: 'Lançamento', color: 'bg-theme02-green' },
      pronto_para_morar: { label: 'Pronto para Morar', color: 'bg-theme02-green' },
      novo: { label: 'Novo', color: 'bg-theme02-green' },
      usado: { label: 'Usado', color: 'bg-theme02-medium-gray' },
    };
    return conditionMap[property.condition] || null;
  };

  const propertyTag = getPropertyTag();

  // List View Layout
  if (viewMode === 'list') {
    return (
      <Link 
        to={`/imovel/${property.slug}`} 
        className="bg-theme02-dark-gray rounded-xl hover:shadow-xl hover:shadow-black/30 transition-all duration-300 group block touch-manipulation overflow-hidden border border-theme02-medium-gray/30"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image Container */}
          <div className="relative w-full sm:w-72 md:w-80 lg:w-96 h-48 sm:h-52 flex-shrink-0 overflow-hidden bg-theme02-black">
            <img
              src={coverImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

            {/* Property Tag Badge */}
            {propertyTag && (
              <div className="absolute top-3 left-3">
                <span className={`${propertyTag.color} text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg`}>
                  {propertyTag.label}
                </span>
              </div>
            )}

            {/* Featured Badge */}
            {property.featured && (
              <div className="absolute top-3 right-3">
                <span className="bg-theme02-green text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg">
                  Destaque
                </span>
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                isFavorited
                  ? 'bg-red-500 text-white'
                  : 'bg-theme02-black/80 text-white hover:bg-red-500'
              }`}
              aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-theme02-green">
                {formatPrice(property.price)}
              </span>
              <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                property.status === 'venda'
                  ? 'bg-theme02-green/20 text-theme02-green border border-theme02-green/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {property.status === 'venda' ? 'Venda' : 'Aluguel'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-theme02-green transition-colors line-clamp-2">
              {property.title}
            </h3>

            <div className="flex items-center text-theme02-light-gray mb-4">
              <MapPin size={14} className="mr-1.5 flex-shrink-0 text-theme02-green" />
              <span className="text-sm">
                {property.address.neighborhood}, {property.address.city}
              </span>
            </div>

            {property.description && (
              <p className="text-sm text-theme02-medium-gray mb-4 line-clamp-2 hidden sm:block">
                {property.description}
              </p>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-5 text-sm text-theme02-light-gray">
              {property.area > 0 && (
                <div className="flex items-center gap-1.5">
                  <Maximize size={15} className="text-theme02-medium-gray" />
                  <span>{property.area} m²</span>
                </div>
              )}
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-1.5">
                  <Bed size={15} className="text-theme02-medium-gray" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-1.5">
                  <Bath size={15} className="text-theme02-medium-gray" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.garages > 0 && (
                <div className="flex items-center gap-1.5">
                  <Car size={15} className="text-theme02-medium-gray" />
                  <span>{property.garages}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid View Layout (default)
  return (
    <Link 
      to={`/imovel/${property.slug}`} 
      className="bg-theme02-dark-gray rounded-xl hover:shadow-xl hover:shadow-theme02-green/10 transition-all duration-300 group block h-full flex flex-col touch-manipulation overflow-hidden border border-theme02-medium-gray/20"
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-theme02-black">
        <img
          src={coverImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

        {/* Property Tag Badge */}
        {propertyTag && (
          <div className="absolute top-3 left-3">
            <span className={`${propertyTag.color} text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg`}>
              {propertyTag.label}
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {property.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-theme02-green text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg">
              Destaque
            </span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-theme02-black/80 text-white hover:bg-red-500'
          }`}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Price and Status Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-theme02-green">
            {formatPrice(property.price)}
          </span>
          <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
            property.status === 'venda'
              ? 'bg-theme02-green/20 text-theme02-green border border-theme02-green/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {property.status === 'venda' ? 'Venda' : 'Aluguel'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-2 group-hover:text-theme02-green transition-colors line-clamp-2">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-theme02-light-gray mb-4">
          <MapPin size={14} className="mr-1.5 flex-shrink-0 text-theme02-green" />
          <span className="text-sm truncate">
            {property.address.neighborhood}, {property.address.city}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Features */}
        <div className="flex items-center flex-wrap gap-4 text-sm text-theme02-light-gray mb-4">
          {property.area > 0 && (
            <div className="flex items-center gap-1">
              <Maximize size={14} className="text-theme02-medium-gray" />
              <span>{property.area} m²</span>
            </div>
          )}
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed size={14} className="text-theme02-medium-gray" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={14} className="text-theme02-medium-gray" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.garages > 0 && (
            <div className="flex items-center gap-1">
              <Car size={14} className="text-theme02-medium-gray" />
              <span>{property.garages}</span>
            </div>
          )}
        </div>

        {/* Ver Detalhes Button */}
        <button className="w-full py-3 bg-theme02-medium-gray/50 text-white rounded-lg font-medium hover:bg-theme02-green transition-all duration-200 border border-theme02-medium-gray/30">
          Ver Detalhes
        </button>
      </div>
    </Link>
  );
};

export default PropertyCardTheme02;
