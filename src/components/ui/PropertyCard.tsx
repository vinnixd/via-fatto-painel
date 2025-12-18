import { Heart, Bed, Bath, Car, Maximize, MapPin } from 'lucide-react';
import { Property } from '@/types/property';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { buildWhatsAppUrl } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorited?: boolean;
}

const PropertyCard = ({ property, onFavorite, isFavorited = false }: PropertyCardProps) => {
  const [imageError, setImageError] = useState(false);

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
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - Ref: ${property.reference}${priceText}. Poderia me passar mais informações?`;
    const url = buildWhatsAppUrl({ phone: property.broker.phone, message });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Link to={`/imovel/${property.slug}`} className="card-property group block h-full flex flex-col">
      {/* Image Container */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-neutral-100">
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

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            property.status === 'venda'
              ? 'bg-primary text-primary-foreground'
              : 'bg-info text-white'
          }`}>
            {property.status === 'venda' ? 'À Venda' : 'Aluguel'}
          </span>
        </div>

        {/* Featured Badge */}
        {property.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-warning text-white px-2 py-1 rounded-full text-xs font-medium">
              Destaque
            </span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-neutral-600 hover:bg-red-500 hover:text-white'
          }`}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        {/* Reference */}
        <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          Ref: {property.reference}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Price */}
        <div className="mb-2">
          <span className="text-2xl font-bold text-primary">
            {formatPrice(property.price)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin size={14} className="mr-1" />
          <span className="text-sm">
            {property.address.neighborhood}, {property.address.city}
          </span>
        </div>

        {/* Spacer to push features to bottom */}
        <div className="flex-1" />

        {/* Features - Fixed at footer, centered */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed size={14} />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={14} />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.garages > 0 && (
            <div className="flex items-center gap-1">
              <Car size={14} />
              <span>{property.garages}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize size={14} />
            <span>{property.area}m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
