import { PropertyFromDB, SiteConfig } from '@/hooks/useSupabaseData';

// ============================================
// SEO SERVICE - Central SEO Management Module
// ============================================

// Property type translations
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

const statusLabels: Record<string, string> = {
  venda: 'à Venda',
  aluguel: 'para Alugar',
  vendido: 'Vendido',
  alugado: 'Alugado',
};

// ============================================
// TEXT SANITIZATION
// ============================================

/**
 * Sanitize text for SEO - removes HTML, excess whitespace, and unwanted characters
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace nbsp
    .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[^\w\s\u00C0-\u024F.,!?;:()'-]/g, '') // Keep only alphanumeric, accented chars, and basic punctuation
    .trim();
}

/**
 * Truncate text to a maximum length, preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) + '...' : truncated.substring(0, maxLength - 3) + '...';
}

/**
 * Normalize text for URL slug
 */
export function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================
// SEO CONFIG INTERFACE
// ============================================

export interface SEOConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType: 'website' | 'article' | 'product';
  noIndex: boolean;
  schemas: object[];
  breadcrumbs?: { name: string; url: string }[];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  keywords?: string;
}

// ============================================
// PROPERTY SEO BUILDER
// ============================================

export function buildPropertySEO(
  property: PropertyFromDB,
  siteConfig: SiteConfig | null,
  baseUrl: string
): SEOConfig {
  const type = propertyTypeLabels[property.type] || property.type;
  const status = statusLabels[property.status] || property.status;
  const city = property.address_city;
  const state = property.address_state;
  const neighborhood = property.address_neighborhood || '';
  const siteName = siteConfig?.seo_title || 'Imobiliária';

  // Build title (max 60 chars)
  let title = property.seo_title || '';
  if (!title) {
    if (neighborhood) {
      title = `${type} ${status} em ${neighborhood}, ${city}`;
    } else {
      title = `${type} ${status} em ${city}, ${state}`;
    }
    if (property.bedrooms > 0 && title.length < 45) {
      title += ` | ${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`;
    }
    if (title.length < 50) {
      title += ` | ${siteName}`;
    }
  }
  title = truncateText(sanitizeText(title), 60);

  // Build description (max 155 chars)
  let description = property.seo_description || '';
  if (!description) {
    description = `Confira ${type.toLowerCase()} ${status.toLowerCase()}`;
    if (neighborhood) {
      description += ` no ${neighborhood}`;
    }
    description += ` em ${city}`;
    
    const features: string[] = [];
    if (property.bedrooms > 0) features.push(`${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`);
    if (property.bathrooms > 0) features.push(`${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`);
    if (property.area > 0) features.push(`${property.area}m²`);
    
    if (features.length > 0) {
      description += `. ${features.join(', ')}`;
    }
    
    if (property.price && property.price > 0) {
      description += `. Valor: ${formatPriceCompact(property.price)}`;
    }
    
    description += '. Veja fotos e detalhes.';
  }
  description = truncateText(sanitizeText(description), 155);

  // Canonical URL
  const canonicalUrl = `${baseUrl}/imovel/${property.slug}`;

  // OG Image - first property image or fallback
  const ogImage = property.images?.[0]?.url || siteConfig?.og_image_url || '';

  // Build schemas
  const schemas: object[] = [];
  
  // RealEstateListing schema
  schemas.push(generateRealEstateListingSchema(property, siteConfig, canonicalUrl));
  
  // Product schema (for price display in search)
  const productSchema = generateProductSchema(property, canonicalUrl);
  if (productSchema) schemas.push(productSchema);
  
  // FAQ schema
  const faqs = generatePropertyFAQs(property);
  if (faqs.length > 0) schemas.push(generateFAQSchema(faqs));

  // Breadcrumbs
  const breadcrumbs = [
    { name: 'Início', url: baseUrl },
    { name: 'Imóveis', url: `${baseUrl}/imoveis` },
  ];
  if (city) {
    breadcrumbs.push({ name: city, url: `${baseUrl}/imoveis?city=${encodeURIComponent(city)}` });
  }
  if (neighborhood) {
    breadcrumbs.push({ name: neighborhood, url: `${baseUrl}/imoveis?city=${encodeURIComponent(city)}&bairro=${encodeURIComponent(neighborhood)}` });
  }
  breadcrumbs.push({ name: property.title, url: canonicalUrl });

  schemas.push(generateBreadcrumbSchema(breadcrumbs));

  // Keywords
  const keywords = [type, status, city, state, neighborhood, 'imóvel', 'comprar', 'alugar']
    .filter(Boolean)
    .join(', ');

  return {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'product',
    noIndex: property.status === 'vendido' || property.status === 'alugado',
    schemas,
    breadcrumbs,
    keywords,
  };
}

// ============================================
// LISTING SEO BUILDER
// ============================================

export interface ListingFilters {
  city?: string;
  neighborhood?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

export function buildListingSEO(
  filters: ListingFilters,
  propertyCount: number,
  siteConfig: SiteConfig | null,
  baseUrl: string
): SEOConfig {
  const siteName = siteConfig?.seo_title || 'Imobiliária';
  const { city, neighborhood, type, status } = filters;

  // Build title
  let title = '';
  const typeLabel = type ? propertyTypeLabels[type] + 's' : 'Imóveis';
  const statusLabel = status ? statusLabels[status] : '';

  if (neighborhood && city) {
    title = `${typeLabel}${statusLabel ? ' ' + statusLabel : ''} no ${neighborhood}, ${city}`;
  } else if (city) {
    title = `${typeLabel}${statusLabel ? ' ' + statusLabel : ''} em ${city}`;
  } else {
    title = `${typeLabel}${statusLabel ? ' ' + statusLabel : ''} - Casas, Apartamentos e Lotes`;
  }
  title = truncateText(`${title} | ${siteName}`, 60);

  // Build description
  let description = '';
  if (city) {
    description = `Encontre ${propertyCount} ${typeLabel.toLowerCase()}${statusLabel ? ' ' + statusLabel.toLowerCase() : ''}`;
    if (neighborhood) {
      description += ` no bairro ${neighborhood}`;
    }
    description += ` em ${city}. Casas, apartamentos e lotes com fotos, preços e detalhes.`;
  } else {
    description = `Encontre ${propertyCount} imóveis${statusLabel ? ' ' + statusLabel.toLowerCase() : ''}. Casas, apartamentos e lotes com fotos, preços e detalhes. Fale no WhatsApp.`;
  }
  description = truncateText(sanitizeText(description), 155);

  // Canonical - always without query params to avoid duplicate content
  const canonicalUrl = `${baseUrl}/imoveis`;

  // OG Image
  const ogImage = siteConfig?.og_image_url || siteConfig?.hero_background_url || '';

  // Breadcrumbs
  const breadcrumbs = [
    { name: 'Início', url: baseUrl },
    { name: 'Imóveis', url: `${baseUrl}/imoveis` },
  ];
  if (city) {
    breadcrumbs.push({ name: city, url: `${baseUrl}/imoveis?city=${encodeURIComponent(city)}` });
  }
  if (neighborhood) {
    breadcrumbs.push({ name: neighborhood, url: `${baseUrl}/imoveis?city=${encodeURIComponent(city)}&bairro=${encodeURIComponent(neighborhood)}` });
  }

  // Schemas
  const schemas: object[] = [generateBreadcrumbSchema(breadcrumbs)];

  // ItemList schema for search results
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    numberOfItems: propertyCount,
    itemListElement: [], // Could be populated with actual property links
  });

  return {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'website',
    noIndex: propertyCount === 0, // noindex empty pages
    schemas,
    breadcrumbs,
  };
}

// ============================================
// BLOG SEO BUILDER
// ============================================

export interface BlogPost {
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  author?: string;
  published_at?: string;
  updated_at?: string;
  tags?: string[];
  category?: string;
}

export function buildBlogPostSEO(
  post: BlogPost,
  siteConfig: SiteConfig | null,
  baseUrl: string
): SEOConfig {
  const siteName = siteConfig?.seo_title || 'Blog';

  // Title (max 60 chars)
  const title = truncateText(`${sanitizeText(post.title)} | Blog ${siteName}`, 60);

  // Description - use summary or first 150 chars of content
  let description = post.summary || '';
  if (!description && post.content) {
    description = sanitizeText(post.content).substring(0, 150);
  }
  description = truncateText(sanitizeText(description), 155) || `Leia ${post.title} no Blog ${siteName}`;

  // Canonical URL
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;

  // OG Image
  const ogImage = post.cover_image || siteConfig?.og_image_url || '';

  // Breadcrumbs
  const breadcrumbs = [
    { name: 'Início', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: canonicalUrl },
  ];

  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    image: ogImage,
    url: canonicalUrl,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      '@type': 'Person',
      name: post.author || siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: siteConfig?.logo_url || '',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    keywords: post.tags?.join(', '),
    articleSection: post.category,
  };

  const schemas: object[] = [
    articleSchema,
    generateBreadcrumbSchema(breadcrumbs),
  ];

  return {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'article',
    noIndex: false,
    schemas,
    breadcrumbs,
    article: {
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      author: post.author,
      section: post.category,
      tags: post.tags,
    },
  };
}

export function buildBlogListSEO(
  siteConfig: SiteConfig | null,
  baseUrl: string,
  postCount: number = 0
): SEOConfig {
  const siteName = siteConfig?.seo_title || 'Blog';

  const title = truncateText(`Blog - Dicas e Notícias do Mercado Imobiliário | ${siteName}`, 60);
  const description = truncateText(
    `Confira ${postCount > 0 ? postCount + ' artigos' : 'artigos'} sobre mercado imobiliário, dicas de decoração, investimentos e muito mais no Blog ${siteName}.`,
    155
  );
  const canonicalUrl = `${baseUrl}/blog`;

  const breadcrumbs = [
    { name: 'Início', url: baseUrl },
    { name: 'Blog', url: canonicalUrl },
  ];

  return {
    title,
    description,
    canonicalUrl,
    ogImage: siteConfig?.og_image_url || '',
    ogType: 'website',
    noIndex: false,
    schemas: [generateBreadcrumbSchema(breadcrumbs)],
    breadcrumbs,
  };
}

// ============================================
// INSTITUTIONAL PAGE SEO BUILDER
// ============================================

export type PageKey = 'home' | 'about' | 'contact' | 'privacy' | 'terms' | 'favorites' | 'location';

const pageConfig: Record<PageKey, { title: string; description: string; path: string }> = {
  home: {
    title: 'Início',
    description: 'Encontre o imóvel dos seus sonhos. A melhor seleção de casas, apartamentos e terrenos.',
    path: '/',
  },
  about: {
    title: 'Sobre Nós',
    description: 'Conheça nossa história, missão e valores. Somos especialistas em imóveis com anos de experiência no mercado.',
    path: '/sobre',
  },
  contact: {
    title: 'Contato',
    description: 'Entre em contato conosco. Estamos prontos para ajudá-lo a encontrar o imóvel ideal.',
    path: '/contato',
  },
  privacy: {
    title: 'Política de Privacidade',
    description: 'Conheça nossa política de privacidade e como tratamos seus dados pessoais.',
    path: '/privacidade',
  },
  terms: {
    title: 'Termos de Uso',
    description: 'Leia nossos termos e condições de uso do site.',
    path: '/termos',
  },
  favorites: {
    title: 'Meus Favoritos',
    description: 'Veja os imóveis que você salvou como favoritos.',
    path: '/favoritos',
  },
  location: {
    title: 'Buscar por Localização',
    description: 'Encontre imóveis na sua região preferida.',
    path: '/imoveis/localizacao',
  },
};

export function buildPageSEO(
  pageKey: PageKey,
  siteConfig: SiteConfig | null,
  baseUrl: string,
  customData?: { title?: string; description?: string }
): SEOConfig {
  const siteName = siteConfig?.seo_title || 'Imobiliária';
  const config = pageConfig[pageKey];

  const title = truncateText(
    customData?.title || `${config.title} | ${siteName}`,
    60
  );
  
  const description = truncateText(
    customData?.description || siteConfig?.seo_description || config.description,
    155
  );

  const canonicalUrl = `${baseUrl}${config.path}`;

  const breadcrumbs = [
    { name: 'Início', url: baseUrl },
  ];
  if (pageKey !== 'home') {
    breadcrumbs.push({ name: config.title, url: canonicalUrl });
  }

  const schemas: object[] = [generateBreadcrumbSchema(breadcrumbs)];

  // Add LocalBusiness schema for home page
  if (pageKey === 'home') {
    const localBusiness = generateLocalBusinessSchema(siteConfig, baseUrl);
    if (localBusiness) schemas.push(localBusiness);
  }

  return {
    title,
    description,
    canonicalUrl,
    ogImage: siteConfig?.og_image_url || siteConfig?.hero_background_url || '',
    ogType: 'website',
    noIndex: pageKey === 'favorites', // noindex favorites page (personalized content)
    schemas,
    breadcrumbs,
    keywords: siteConfig?.seo_keywords,
  };
}

// ============================================
// LEGACY FUNCTIONS (maintained for compatibility)
// ============================================

export function generatePropertyTitle(property: PropertyFromDB): string {
  const type = propertyTypeLabels[property.type] || property.type;
  const status = statusLabels[property.status] || property.status;
  const city = property.address_city;
  const state = property.address_state;
  
  const features: string[] = [];
  if (property.bedrooms > 0) {
    features.push(`${property.bedrooms} Quarto${property.bedrooms > 1 ? 's' : ''}`);
  }
  if (property.area > 0) {
    features.push(`${property.area}m²`);
  }
  
  let title = `${type} ${status} em ${city} ${state}`;
  if (features.length > 0) {
    title += ` | ${features.join(', ')}`;
  }
  
  if (title.length > 60) {
    title = `${type} ${status} em ${city} ${state}`;
    if (title.length > 60) {
      title = `${type} ${status} em ${city}`;
    }
  }
  
  return title.substring(0, 60);
}

export function generatePropertyDescription(property: PropertyFromDB): string {
  const type = propertyTypeLabels[property.type] || property.type;
  const status = statusLabels[property.status] || property.status;
  const neighborhood = property.address_neighborhood || '';
  const city = property.address_city;
  
  const features: string[] = [];
  if (property.bedrooms > 0) {
    features.push(`${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`);
  }
  if (property.suites > 0) {
    features.push(`${property.suites} suíte${property.suites > 1 ? 's' : ''}`);
  }
  if (property.bathrooms > 0) {
    features.push(`${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`);
  }
  if (property.garages > 0) {
    features.push(`${property.garages} vaga${property.garages > 1 ? 's' : ''}`);
  }
  
  let description = `${type} ${status}`;
  if (neighborhood) {
    description += ` no ${neighborhood}`;
  }
  description += ` em ${city}`;
  
  if (features.length > 0) {
    description += ` com ${features.join(', ')}`;
  }
  
  const price = property.price && property.price > 0
    ? `. ${formatPriceCompact(property.price)}`
    : '';
  
  description += `${price}. Agende uma visita!`;
  
  return description.substring(0, 155);
}

export function generatePropertySlug(property: {
  type: string;
  status: string;
  address_city: string;
  address_state: string;
  bedrooms?: number;
  reference?: string | null;
}): string {
  const type = property.type;
  const status = property.status === 'venda' ? 'a-venda' : 
                 property.status === 'aluguel' ? 'para-alugar' : property.status;
  const city = normalizeSlug(property.address_city);
  const state = property.address_state.toLowerCase();
  
  let slug = `${type}-${status}-${city}-${state}`;
  
  if (property.bedrooms && property.bedrooms > 0) {
    slug += `-${property.bedrooms}-quartos`;
  }
  
  if (property.reference) {
    slug += `-${property.reference}`;
  } else {
    slug += `-${Date.now().toString(36)}`;
  }
  
  return slug.toLowerCase();
}

export function generateLocationTitle(
  city: string,
  state: string,
  neighborhood?: string,
  type?: string,
  status?: string
): string {
  const typeLabel = type ? propertyTypeLabels[type] + 's' : 'Imóveis';
  const statusLabel = status ? statusLabels[status] : '';
  
  let title = typeLabel;
  if (statusLabel) {
    title += ` ${statusLabel}`;
  }
  
  if (neighborhood) {
    title += ` no ${neighborhood}`;
  }
  title += ` em ${city} ${state}`;
  
  return title.substring(0, 60);
}

export function generateLocationDescription(
  city: string,
  state: string,
  count: number,
  neighborhood?: string,
  type?: string,
  status?: string
): string {
  const typeLabel = type ? propertyTypeLabels[type]?.toLowerCase() + 's' : 'imóveis';
  const statusLabel = status ? statusLabels[status]?.toLowerCase() : '';
  
  let description = `Encontre ${count} ${typeLabel}`;
  if (statusLabel) {
    description += ` ${statusLabel}`;
  }
  
  if (neighborhood) {
    description += ` no bairro ${neighborhood}`;
  }
  description += ` em ${city}, ${state}. Veja fotos, preços e agende sua visita.`;
  
  return description.substring(0, 155);
}

// ============================================
// STRUCTURED DATA GENERATORS
// ============================================

export function generateRealEstateListingSchema(
  property: PropertyFromDB,
  siteConfig: SiteConfig | null,
  url: string
) {
  const type = propertyTypeLabels[property.type] || property.type;
  const images = property.images?.map(img => img.url) || [];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: sanitizeText(property.description) || generatePropertyDescription(property),
    url: url,
    datePosted: property.created_at,
    dateModified: property.updated_at,
    image: images,
    offers: property.price && property.price > 0 ? {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'BRL',
      availability: property.status === 'vendido' || property.status === 'alugado' 
        ? 'https://schema.org/SoldOut' 
        : 'https://schema.org/InStock',
    } : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address_street || '',
      addressLocality: property.address_city,
      addressRegion: property.address_state,
      postalCode: property.address_zipcode || '',
      addressCountry: 'BR',
    },
    geo: property.address_lat && property.address_lng ? {
      '@type': 'GeoCoordinates',
      latitude: property.address_lat,
      longitude: property.address_lng,
    } : undefined,
    numberOfRooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    numberOfBedrooms: property.bedrooms || undefined,
    floorSize: property.area ? {
      '@type': 'QuantitativeValue',
      value: property.area,
      unitCode: 'MTK',
    } : undefined,
    amenityFeature: property.features?.map(feature => ({
      '@type': 'LocationFeatureSpecification',
      name: feature,
    })),
    broker: siteConfig ? {
      '@type': 'RealEstateAgent',
      name: siteConfig.seo_title || 'Imobiliária',
      telephone: siteConfig.phone || '',
      email: siteConfig.email || '',
      address: siteConfig.address || '',
    } : undefined,
  };
}

export function generateProductSchema(property: PropertyFromDB, url: string) {
  if (!property.price || property.price === 0) return null;
  
  const images = property.images?.map(img => img.url) || [];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: sanitizeText(property.description) || generatePropertyDescription(property),
    image: images[0] || '',
    url: url,
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'BRL',
      availability: property.status === 'vendido' || property.status === 'alugado' 
        ? 'https://schema.org/SoldOut' 
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Imobiliária',
      },
    },
    category: `Imóveis > ${propertyTypeLabels[property.type] || property.type}`,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateLocalBusinessSchema(siteConfig: SiteConfig | null, baseUrl: string) {
  if (!siteConfig) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: siteConfig.seo_title || 'Imobiliária',
    description: siteConfig.seo_description || 'Especialistas em imóveis',
    url: baseUrl,
    logo: siteConfig.logo_url || siteConfig.logo_horizontal_url || '',
    image: siteConfig.og_image_url || siteConfig.hero_background_url || '',
    telephone: siteConfig.phone || '',
    email: siteConfig.email || '',
    address: siteConfig.address ? {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address,
      addressCountry: 'BR',
    } : undefined,
    sameAs: [
      siteConfig.social_facebook,
      siteConfig.social_instagram,
      siteConfig.social_youtube,
      siteConfig.social_linkedin,
    ].filter(Boolean),
    priceRange: '$$$',
    openingHours: 'Mo-Fr 08:00-18:00',
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generatePropertyFAQs(property: PropertyFromDB): { question: string; answer: string }[] {
  const type = propertyTypeLabels[property.type] || property.type;
  const statusLabel = property.status === 'venda' ? 'à venda' : 'para alugar';
  const city = property.address_city;
  
  const faqs: { question: string; answer: string }[] = [];
  
  if (property.price && property.price > 0) {
    faqs.push({
      question: `Qual o valor ${property.status === 'venda' ? 'de venda' : 'do aluguel'} deste imóvel?`,
      answer: `Este ${type.toLowerCase()} está ${statusLabel} por ${formatPrice(property.price)}.`,
    });
  }
  
  faqs.push({
    question: `Onde fica localizado este imóvel?`,
    answer: `Este imóvel está localizado ${property.address_neighborhood ? `no bairro ${property.address_neighborhood}, ` : ''}em ${city}, ${property.address_state}.`,
  });
  
  if (property.bedrooms > 0 || property.bathrooms > 0) {
    const features: string[] = [];
    if (property.bedrooms > 0) features.push(`${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`);
    if (property.suites > 0) features.push(`${property.suites} suíte${property.suites > 1 ? 's' : ''}`);
    if (property.bathrooms > 0) features.push(`${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`);
    if (property.garages > 0) features.push(`${property.garages} vaga${property.garages > 1 ? 's' : ''} de garagem`);
    
    faqs.push({
      question: `Quantos quartos e banheiros tem este imóvel?`,
      answer: `Este ${type.toLowerCase()} possui ${features.join(', ')}.`,
    });
  }
  
  if (property.area > 0) {
    faqs.push({
      question: `Qual a área total deste imóvel?`,
      answer: `A área total é de ${property.area}m²${property.built_area ? `, sendo ${property.built_area}m² de área construída` : ''}.`,
    });
  }
  
  if (property.status === 'venda') {
    faqs.push({
      question: `Este imóvel aceita financiamento?`,
      answer: property.financing 
        ? `Sim, este ${type.toLowerCase()} aceita financiamento bancário.`
        : `Consulte conosco sobre as condições de pagamento para este imóvel.`,
    });
  }
  
  return faqs;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatPriceCompact(price: number): string {
  if (price >= 1000000) {
    return `R$ ${(price / 1000000).toFixed(1).replace('.', ',')} milhões`;
  }
  if (price >= 1000) {
    return `R$ ${Math.round(price / 1000)} mil`;
  }
  return formatPrice(price);
}

// ============================================
// OPEN GRAPH & TWITTER META GENERATORS
// ============================================

export function generateOpenGraphMeta(
  title: string,
  description: string,
  url: string,
  image?: string,
  type: 'website' | 'article' | 'product' = 'website',
  article?: SEOConfig['article']
) {
  const meta: Record<string, string> = {
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:type': type,
    'og:locale': 'pt_BR',
    'og:site_name': 'Via Fatto Imóveis',
  };
  
  if (image) {
    meta['og:image'] = image;
    meta['og:image:secure_url'] = image;
    meta['og:image:type'] = image.includes('.png') ? 'image/png' : 'image/jpeg';
    meta['og:image:width'] = '1200';
    meta['og:image:height'] = '630';
    meta['og:image:alt'] = title;
  }

  // Article-specific meta
  if (type === 'article' && article) {
    if (article.publishedTime) meta['article:published_time'] = article.publishedTime;
    if (article.modifiedTime) meta['article:modified_time'] = article.modifiedTime;
    if (article.author) meta['article:author'] = article.author;
    if (article.section) meta['article:section'] = article.section;
  }
  
  return meta;
}

export function generateTwitterMeta(
  title: string,
  description: string,
  image?: string
) {
  const meta: Record<string, string> = {
    'twitter:card': image ? 'summary_large_image' : 'summary',
    'twitter:title': title,
    'twitter:description': description,
  };
  
  if (image) {
    meta['twitter:image'] = image;
    meta['twitter:image:alt'] = title;
  }
  
  return meta;
}
