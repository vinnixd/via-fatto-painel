import { Heart, Bed, Bath, Car, Maximize, MapPin, Eye } from 'lucide-react';
import { Property } from '@/types/property';
import { Link } from 'react-router-dom';
import { useState } from 'react';

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const getWhatsAppUrl = () => {
    const priceText = property.price && property.price > 0 ? ` - ${formatPrice(property.price)}` : '';
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - Ref: ${property.reference}${priceText}. Poderia me passar mais informações?`;
    return `https://wa.me/55${property.broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="card-property group">
      {/* Image Container */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={imageError ? '/placeholder.svg' : property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
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
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        {/* Views Counter */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          <Eye size={12} />
          <span>{property.views}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
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

        {/* Features */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          {property.bedrooms > 0 && (
            <div className="flex items-center space-x-1">
              <Bed size={16} />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center space-x-1">
              <Bath size={16} />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.garages > 0 && (
            <div className="flex items-center space-x-1">
              <Car size={16} />
              <span>{property.garages}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Maximize size={16} />
            <span>{property.area}m²</span>
          </div>
        </div>

        {/* Reference */}
        <div className="text-xs text-muted-foreground mb-3">
          Ref: {property.reference}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            to={`/imovel/${property.slug}`}
            className="flex-1 btn-secondary text-sm py-2 text-center"
          >
            Ver Detalhes
          </Link>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-primary text-sm py-2 text-center"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;