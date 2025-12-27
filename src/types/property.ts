export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  type: 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural' | 'cobertura' | 'flat' | 'galpao' | 'loft';
  status: 'venda' | 'aluguel' | 'vendido' | 'alugado';
  condition?: 'lancamento' | 'pronto_para_morar' | 'novo' | 'usado';
  featured: boolean;
  images: string[];
  video?: string;
  
  // Características principais
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garages: number;
  area: number; // em m²
  builtArea?: number; // área construída
  
  // Localização
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Características específicas
  features: string[];
  amenities: string[];
  
  // Financiamento e documentação
  financing: boolean;
  documentation: 'regular' | 'irregular' | 'pendente';
  
  // Perfil do imóvel
  profile: 'residencial' | 'comercial' | 'industrial' | 'misto';
  
  // Dados do anúncio
  reference: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  
  // Contato
  broker: {
    name: string;
    phone: string;
    email: string;
    creci: string;
  };
}

export interface PropertyFilter {
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  suites?: number;
  garages?: number;
  minArea?: number;
  maxArea?: number;
  features?: string[];
  status?: string;
}

export interface PropertySearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'newest' | 'oldest';
  filters?: PropertyFilter;
}