import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  status: string;
  type: string;
  profile: string;
  condition: string | null;
  address_street: string | null;
  address_neighborhood: string | null;
  address_city: string;
  address_state: string;
  address_zipcode: string | null;
  address_lat: number | null;
  address_lng: number | null;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garages: number;
  area: number;
  built_area: number | null;
  featured: boolean;
  reference: string | null;
  condo_fee: number | null;
  iptu: number | null;
  features: string[] | null;
  amenities: string[] | null;
  property_images: { url: string; alt: string | null; order_index: number }[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function buildXmlFeed(properties: Property[], config: any, baseUrl: string): string {
  const items = properties.map((p) => {
    const images = p.property_images
      .sort((a, b) => a.order_index - b.order_index)
      .slice(0, config.limite_fotos || 20)
      .map((img) => `    <Fotos><URLArquivo>${escapeXml(img.url)}</URLArquivo></Fotos>`)
      .join('\n');

    const description = config.remover_html && p.description 
      ? stripHtml(p.description) 
      : (p.description || '');

    const priceDisplay = p.price > 0 
      ? `<PrecoVenda>${p.price}</PrecoVenda>`
      : (config.preco_consulte ? '<PrecoVenda>Consulte</PrecoVenda>' : '');

    return `  <Imovel>
    <CodigoImovel>${escapeXml(p.reference || p.id)}</CodigoImovel>
    <TituloImovel>${escapeXml(p.title)}</TituloImovel>
    <TipoImovel>${escapeXml(translateType(p.type))}</TipoImovel>
    <SubTipoImovel>${escapeXml(translateProfile(p.profile))}</SubTipoImovel>
    <CategoriaImovel>${p.status === 'venda' ? 'Venda' : 'Aluguel'}</CategoriaImovel>
    ${priceDisplay}
    <Observacao>${escapeXml(description)}</Observacao>
    <InscricaoMunicipal></InscricaoMunicipal>
    <QtdDormitorios>${p.bedrooms}</QtdDormitorios>
    <QtdSuites>${p.suites}</QtdSuites>
    <QtdBanheiros>${p.bathrooms}</QtdBanheiros>
    <QtdVagas>${p.garages}</QtdVagas>
    <AreaUtil>${p.area}</AreaUtil>
    <AreaTotal>${p.built_area || p.area}</AreaTotal>
    <Endereco>
      <Logradouro>${escapeXml(p.address_street || '')}</Logradouro>
      <Bairro>${escapeXml(p.address_neighborhood || '')}</Bairro>
      <Cidade>${escapeXml(p.address_city)}</Cidade>
      <UF>${escapeXml(p.address_state)}</UF>
      <CEP>${escapeXml(p.address_zipcode || '')}</CEP>
    </Endereco>
    <Destaque>${p.featured ? 'Sim' : 'Nao'}</Destaque>
    <URLDetalhes>${escapeXml(baseUrl)}/imovel/${escapeXml(p.slug)}</URLDetalhes>
${images}
  </Imovel>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Imoveis>
${items}
  </Imoveis>
</Carga>`;
}

// ============================================================
// VRSync XML Feed Format (ZAP Imóveis / VivaReal)
// ============================================================
// Documentation: https://developers.grupozap.com/feeds/vrsync/

function buildVRSyncFeed(properties: Property[], config: any, baseUrl: string): string {
  const listings = properties.map((p) => {
    // Map property type to VRSync PropertyType
    const propertyType = mapToVRSyncPropertyType(p.type);
    
    // Transaction type
    const transactionType = p.status === 'aluguel' ? 'For Rent' : 'For Sale';
    
    // Price elements
    let priceElement = '';
    if (p.status === 'aluguel') {
      priceElement = `      <RentalPrice currency="BRL">${p.price}</RentalPrice>`;
    } else {
      priceElement = `      <ListPrice currency="BRL">${p.price}</ListPrice>`;
    }
    
    // Images (minimum 3, max 50 for VRSync)
    const images = p.property_images
      .sort((a, b) => a.order_index - b.order_index)
      .slice(0, config.limite_fotos || 50)
      .map((img, idx) => `        <Item caption="${escapeXml(img.alt || `Imagem ${idx + 1}`)}" primary="${idx === 0 ? 'true' : 'false'}">${escapeXml(img.url)}</Item>`)
      .join('\n');
    
    // Features
    const features: string[] = [];
    if (p.features) {
      features.push(...p.features.map(f => mapToVRSyncFeature(f)));
    }
    if (p.amenities) {
      features.push(...p.amenities.map(a => mapToVRSyncFeature(a)));
    }
    
    const featuresXml = [...new Set(features.filter(Boolean))]
      .map(f => `        <Feature>${escapeXml(f)}</Feature>`)
      .join('\n');
    
    // Description with CDATA
    const description = p.description 
      ? stripHtml(p.description).substring(0, 10000) 
      : `${translateType(p.type)} ${p.status === 'venda' ? 'à venda' : 'para alugar'} em ${p.address_neighborhood || p.address_city}`;
    
    // Title validation (10-100 chars)
    const title = (p.title || '').substring(0, 100);
    
    return `    <Listing>
      <ListingID>${escapeXml(p.reference || p.id.substring(0, 50))}</ListingID>
      <Title><![CDATA[${title}]]></Title>
      <TransactionType>${transactionType}</TransactionType>
      <Featured>${p.featured}</Featured>
      <ListDate>${new Date().toISOString().split('T')[0]}</ListDate>
      <Details>
        <PropertyType>${propertyType}</PropertyType>
        <Description><![CDATA[${description}]]></Description>
        <UsableArea unit="square metres">${p.area || 0}</UsableArea>
        <LotArea unit="square metres">${p.built_area || p.area || 0}</LotArea>
        <Bedrooms>${p.bedrooms || 0}</Bedrooms>
        <Suites>${p.suites || 0}</Suites>
        <Bathrooms>${p.bathrooms || 0}</Bathrooms>
        <Garage type="Parking Spaces">${p.garages || 0}</Garage>
${p.condo_fee && p.condo_fee > 0 ? `        <PropertyAdministrationFee currency="BRL">${p.condo_fee}</PropertyAdministrationFee>` : ''}
${p.iptu && p.iptu > 0 ? `        <YearlyTax currency="BRL">${p.iptu}</YearlyTax>` : ''}
${featuresXml ? `        <Features>\n${featuresXml}\n        </Features>` : ''}
      </Details>
      <Location displayAddress="${config.exibir_endereco === 'completo' ? 'All' : config.exibir_endereco === 'rua' ? 'Street' : 'Neighborhood'}">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${escapeXml(p.address_state)}">${escapeXml(getStateName(p.address_state))}</State>
        <City>${escapeXml(p.address_city)}</City>
        <Neighborhood>${escapeXml(p.address_neighborhood || '')}</Neighborhood>
${p.address_street ? `        <Address>${escapeXml(p.address_street)}</Address>` : ''}
        <PostalCode>${escapeXml((p.address_zipcode || '').replace(/\D/g, ''))}</PostalCode>
${p.address_lat && p.address_lng ? `        <Latitude>${p.address_lat}</Latitude>\n        <Longitude>${p.address_lng}</Longitude>` : ''}
      </Location>
${priceElement}
      <Media>
${images}
      </Media>
      <ContactInfo>
        <Website>${escapeXml(baseUrl)}/imovel/${escapeXml(p.slug)}</Website>
      </ContactInfo>
    </Listing>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>Imobiliária</Provider>
    <Email>${config.email || 'contato@imobiliaria.com.br'}</Email>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>`;
}

// Map property type to VRSync PropertyType
function mapToVRSyncPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    casa: 'Residential / Home',
    apartamento: 'Residential / Apartment',
    cobertura: 'Residential / Penthouse',
    flat: 'Residential / Flat',
    loft: 'Residential / Loft',
    terreno: 'Residential / Land Lot',
    comercial: 'Commercial / Building',
    galpao: 'Commercial / Industrial',
    rural: 'Residential / Farm/Ranch',
  };
  return typeMap[type] || 'Residential / Home';
}

// Map features to VRSync feature names
function mapToVRSyncFeature(feature: string): string {
  const featureLower = feature.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const featureMap: Record<string, string> = {
    'ar condicionado': 'Air conditioning',
    'ar-condicionado': 'Air conditioning',
    'piscina': 'Pool',
    'churrasqueira': 'BBQ',
    'academia': 'Gym',
    'sauna': 'Sauna',
    'quadra': 'Sports court',
    'playground': 'Playground',
    'salao de festas': 'Party room',
    'portaria': 'Gated community',
    'seguranca': 'Security 24h',
    'elevador': 'Elevator',
    'varanda': 'Balcony',
    'jardim': 'Garden',
    'lavanderia': 'Laundry',
    'mobiliado': 'Furnished',
    'garagem': 'Parking',
    'suite': 'Suite',
    'closet': 'Closet',
    'cozinha americana': 'American kitchen',
    'quintal': 'Backyard',
    'area de servico': 'Service area',
    'depedencia de empregada': 'Maid room',
  };
  
  for (const [key, value] of Object.entries(featureMap)) {
    if (featureLower.includes(key)) {
      return value;
    }
  }
  
  return feature;
}

// Get state full name from abbreviation
function getStateName(abbr: string): string {
  const states: Record<string, string> = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
    CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
    MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
    RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
    RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
    SE: 'Sergipe', TO: 'Tocantins',
  };
  return states[abbr.toUpperCase()] || abbr;
}

function buildJsonFeed(properties: Property[], config: any, baseUrl: string): object {
  return {
    total: properties.length,
    updated_at: new Date().toISOString(),
    properties: properties.map((p) => ({
      id: p.reference || p.id,
      title: p.title,
      type: translateType(p.type),
      profile: translateProfile(p.profile),
      status: p.status === 'venda' ? 'sale' : 'rent',
      price: p.price > 0 ? p.price : (config.preco_consulte ? 'Consulte' : null),
      description: config.remover_html && p.description ? stripHtml(p.description) : p.description,
      bedrooms: p.bedrooms,
      suites: p.suites,
      bathrooms: p.bathrooms,
      parking: p.garages,
      area: p.area,
      built_area: p.built_area,
      featured: p.featured,
      address: {
        street: p.address_street,
        neighborhood: p.address_neighborhood,
        city: p.address_city,
        state: p.address_state,
        zipcode: p.address_zipcode,
      },
      url: `${baseUrl}/imovel/${p.slug}`,
      images: p.property_images
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, config.limite_fotos || 20)
        .map((img) => ({
          url: img.url,
          alt: img.alt,
        })),
    })),
  };
}

function buildCsvFeed(properties: Property[], config: any, baseUrl: string): string {
  const headers = [
    'codigo', 'titulo', 'tipo', 'categoria', 'preco', 'descricao',
    'quartos', 'suites', 'banheiros', 'vagas', 'area', 'area_construida',
    'logradouro', 'bairro', 'cidade', 'estado', 'cep', 'destaque', 'url', 'fotos'
  ];

  const rows = properties.map((p) => {
    const images = p.property_images
      .sort((a, b) => a.order_index - b.order_index)
      .slice(0, config.limite_fotos || 20)
      .map((img) => img.url)
      .join('|');

    const description = config.remover_html && p.description 
      ? stripHtml(p.description) 
      : (p.description || '');

    return [
      p.reference || p.id,
      escapeCsv(p.title),
      translateType(p.type),
      p.status === 'venda' ? 'Venda' : 'Aluguel',
      p.price > 0 ? p.price : (config.preco_consulte ? 'Consulte' : ''),
      escapeCsv(description),
      p.bedrooms,
      p.suites,
      p.bathrooms,
      p.garages,
      p.area,
      p.built_area || '',
      escapeCsv(p.address_street || ''),
      escapeCsv(p.address_neighborhood || ''),
      escapeCsv(p.address_city),
      escapeCsv(p.address_state),
      p.address_zipcode || '',
      p.featured ? 'Sim' : 'Nao',
      `${baseUrl}/imovel/${p.slug}`,
      images
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCsv(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function translateType(type: string): string {
  const types: Record<string, string> = {
    casa: 'Casa',
    apartamento: 'Apartamento',
    terreno: 'Terreno',
    comercial: 'Comercial',
    rural: 'Rural',
    cobertura: 'Cobertura',
    flat: 'Flat',
    galpao: 'Galpão',
  };
  return types[type] || type;
}

function translateProfile(profile: string): string {
  const profiles: Record<string, string> = {
    residencial: 'Residencial',
    comercial: 'Comercial',
    industrial: 'Industrial',
    misto: 'Misto',
  };
  return profiles[profile] || profile;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const portalSlug = url.searchParams.get('portal');
    const token = url.searchParams.get('token');

    if (!portalSlug || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing portal or token parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch portal
    const { data: portal, error: portalError } = await supabase
      .from('portais')
      .select('*')
      .eq('slug', portalSlug)
      .eq('token_feed', token)
      .eq('ativo', true)
      .single();

    if (portalError || !portal) {
      console.error('Portal not found or invalid token:', portalError);
      return new Response(
        JSON.stringify({ error: 'Invalid portal or token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = portal.config || {};
    const filtros = config.filtros || {};

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        id, title, slug, description, price, status, type, profile, condition,
        address_street, address_neighborhood, address_city, address_state, address_zipcode,
        address_lat, address_lng,
        bedrooms, suites, bathrooms, garages, area, built_area, featured, reference,
        condo_fee, iptu, features, amenities,
        property_images (url, alt, order_index)
      `);

    // Apply filters - ALWAYS filter by integrar_portais = true
    query = query.eq('integrar_portais', true);
    
    if (filtros.apenas_ativos !== false) {
      query = query.eq('active', true);
    }
    if (filtros.apenas_venda) {
      query = query.eq('status', 'venda');
    }
    if (filtros.apenas_aluguel) {
      query = query.eq('status', 'aluguel');
    }
    if (filtros.apenas_destaques) {
      query = query.eq('featured', true);
    }

    const { data: properties, error: propertiesError } = await query.order('order_index');

    if (propertiesError) {
      console.error('Properties query error:', propertiesError);
      throw propertiesError;
    }

    // Apply post-query filters
    let filteredProperties = (properties || []) as Property[];

    if (filtros.excluir_sem_fotos) {
      filteredProperties = filteredProperties.filter(
        (p) => p.property_images && p.property_images.length > 0
      );
    }

    if (filtros.excluir_sem_endereco) {
      filteredProperties = filteredProperties.filter(
        (p) => p.address_city && p.address_state
      );
    }

    const baseUrl = config.dominio_base || `${url.origin}`;

    // Generate feed based on format
    let content: string;
    let contentType: string;

    // Determine if this is a VRSync portal (ZAP, VivaReal, ImovelWeb)
    const isVRSyncPortal = ['zap', 'zapimoveis', 'zap-imoveis', 'vivareal', 'viva-real', 'imovelweb', 'imovel-web'].includes(portalSlug.toLowerCase());

    switch (portal.formato_feed) {
      case 'json':
        content = JSON.stringify(buildJsonFeed(filteredProperties, config, baseUrl));
        contentType = 'application/json';
        break;
      case 'csv':
        content = buildCsvFeed(filteredProperties, config, baseUrl);
        contentType = 'text/csv';
        break;
      case 'xml':
        // Use VRSync format for ZAP/VivaReal portals, standard XML for others
        if (isVRSyncPortal || config.formato_vrsync) {
          content = buildVRSyncFeed(filteredProperties, config, baseUrl);
        } else {
          content = buildXmlFeed(filteredProperties, config, baseUrl);
        }
        contentType = 'application/xml';
        break;
      default:
        // Default to VRSync for ZAP/VivaReal, standard XML for others
        if (isVRSyncPortal) {
          content = buildVRSyncFeed(filteredProperties, config, baseUrl);
        } else {
          content = buildXmlFeed(filteredProperties, config, baseUrl);
        }
        contentType = 'application/xml';
    }

    console.log(`Feed generated for ${portalSlug}: ${filteredProperties.length} properties`);

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': `${contentType}; charset=utf-8`,
        'Cache-Control': 'public, max-age=300',
        'ETag': `"${Date.now()}"`,
      },
    });
  } catch (error) {
    console.error('Feed generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
