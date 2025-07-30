import { Property } from '@/types/property';

export const mockProperties: Property[] = [
  {
    id: '1',
    slug: 'casa-alto-padrao-alphaville',
    title: 'Casa Alto Padrão em Alphaville',
    description: 'Magnífica casa em condomínio fechado, com acabamento de primeira linha, piscina e área gourmet completa.',
    price: 2500000,
    type: 'casa',
    status: 'venda',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop'
    ],
    bedrooms: 5,
    suites: 3,
    bathrooms: 6,
    garages: 4,
    area: 800,
    builtArea: 600,
    address: {
      street: 'Rua das Palmeiras, 123',
      neighborhood: 'Alphaville',
      city: 'Barueri',
      state: 'SP',
      zipCode: '06454-000',
      coordinates: { lat: -23.5089, lng: -46.8568 }
    },
    features: [
      'Piscina',
      'Área Gourmet',
      'Jardim',
      'Lareira',
      'Closet',
      'Escritório',
      'Sala de Cinema',
      'Churrasqueira'
    ],
    amenities: [
      'Condomínio Fechado',
      'Segurança 24h',
      'Área Verde',
      'Playground',
      'Quadra de Tênis',
      'Academia'
    ],
    financing: true,
    documentation: 'regular',
    profile: 'residencial',
    reference: 'CASA001',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    views: 1250,
    broker: {
      name: 'Via Fatto Team',
      phone: '11999887766',
      email: 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456'
    }
  },
  {
    id: '2',
    slug: 'apartamento-morumbi-luxury',
    title: 'Apartamento de Luxo no Morumbi',
    description: 'Apartamento moderno com vista panorâmica da cidade, localizado em um dos bairros mais valorizados de São Paulo.',
    price: 1800000,
    type: 'apartamento',
    status: 'venda',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop'
    ],
    bedrooms: 3,
    suites: 2,
    bathrooms: 4,
    garages: 3,
    area: 180,
    builtArea: 180,
    address: {
      street: 'Avenida Giovanni Gronchi, 5930',
      neighborhood: 'Morumbi',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05724-003'
    },
    features: [
      'Varanda Gourmet',
      'Vista Panorâmica',
      'Armários Planejados',
      'Piso Porcelanato',
      'Ar Condicionado',
      'Lavatório'
    ],
    amenities: [
      'Piscina',
      'Academia',
      'Salão de Festas',
      'Brinquedoteca',
      'Portaria 24h',
      'Elevador'
    ],
    financing: true,
    documentation: 'regular',
    profile: 'residencial',
    reference: 'APT002',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    views: 890,
    broker: {
      name: 'Via Fatto Team',
      phone: '11999887766',
      email: 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456'
    }
  },
  {
    id: '3',
    slug: 'terreno-comercial-centro',
    title: 'Terreno Comercial no Centro',
    description: 'Excelente terreno para investimento comercial, localizado em área de grande movimento e fácil acesso.',
    price: 850000,
    type: 'terreno',
    status: 'venda',
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    garages: 0,
    area: 500,
    address: {
      street: 'Rua Barão de Itapetininga, 255',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01042-001'
    },
    features: [
      'Esquina',
      'Plano',
      'Documentação Regular',
      'Aceita Construção'
    ],
    amenities: [
      'Transporte Público',
      'Comércio Local',
      'Bancos Próximos'
    ],
    financing: true,
    documentation: 'regular',
    profile: 'comercial',
    reference: 'TER003',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-15',
    views: 445,
    broker: {
      name: 'Via Fatto Team',
      phone: '11999887766',
      email: 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456'
    }
  },
  {
    id: '4',
    slug: 'casa-vila-madalena',
    title: 'Casa Charmosa na Vila Madalena',
    description: 'Casa renovada no coração da Vila Madalena, próxima a bares, restaurantes e vida noturna.',
    price: 1200000,
    type: 'casa',
    status: 'venda',
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop'
    ],
    bedrooms: 3,
    suites: 1,
    bathrooms: 3,
    garages: 2,
    area: 220,
    builtArea: 180,
    address: {
      street: 'Rua Harmonia, 890',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-000'
    },
    features: [
      'Quintal',
      'Terraço',
      'Cozinha Gourmet',
      'Recém Reformada'
    ],
    amenities: [
      'Vida Noturna',
      'Restaurantes',
      'Transporte Público'
    ],
    financing: true,
    documentation: 'regular',
    profile: 'residencial',
    reference: 'CASA004',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-19',
    views: 720,
    broker: {
      name: 'Via Fatto Team',
      phone: '11999887766',
      email: 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456'
    }
  },
  {
    id: '5',
    slug: 'apartamento-jardins-compacto',
    title: 'Apartamento Compacto nos Jardins',
    description: 'Apartamento moderno e funcional em uma das regiões mais nobres de São Paulo.',
    price: 980000,
    type: 'apartamento',
    status: 'venda',
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
    ],
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    garages: 1,
    area: 85,
    builtArea: 85,
    address: {
      street: 'Rua Augusta, 2340',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01412-100'
    },
    features: [
      'Sacada',
      'Armários Planejados',
      'Piso Laminado'
    ],
    amenities: [
      'Portaria 24h',
      'Elevador',
      'Localização Premium'
    ],
    financing: true,
    documentation: 'regular',
    profile: 'residencial',
    reference: 'APT005',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-16',
    views: 560,
    broker: {
      name: 'Via Fatto Team',
      phone: '11999887766',
      email: 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456'
    }
  },
  {
    id: '6',
    slug: 'casa-sobrado-santana',
    title: 'Sobrado Familiar em Santana',
    description: 'Sobrado espaçoso ideal para famílias grandes, com ótima localização e fácil acesso ao transporte público.',
    price: 750000,
    type: 'casa',
    status: 'venda',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
    ],
    bedrooms: 4,
    suites: 2,
    bathrooms: 4,
    garages: 2,
    area: 300,
    builtArea: 250,
    address: {
      street: 'Rua Voluntários da Pátria, 1240',
      neighborhood: 'Santana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02011-000'
    },
    features: [
      'Quintal Grande',
      'Churrasqueira',
      'Área de Serviço',
      'Escritório'
    ],
    amenities: [
      'Próximo ao Metrô',
      'Comércio Local',
      'Escolas Próximas'
    ],
    financing: true,
    documentation: 'regular',
    profile: 'residencial',
    reference: 'CASA006',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-21',
    views: 680,
    broker: {
      name: 'Via Fatto Team',
      phone: '11999887766',
      email: 'contato@viafatto.com.br',
      creci: 'CRECI-SP 123456'
    }
  }
];