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
  address_street: string | null;
  address_neighborhood: string | null;
  address_city: string;
  address_state: string;
  address_zipcode: string | null;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garages: number;
  area: number;
  built_area: number | null;
  featured: boolean;
  reference: string | null;
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
        id, title, slug, description, price, status, type, profile,
        address_street, address_neighborhood, address_city, address_state, address_zipcode,
        bedrooms, suites, bathrooms, garages, area, built_area, featured, reference,
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

    switch (portal.formato_feed) {
      case 'json':
        content = JSON.stringify(buildJsonFeed(filteredProperties, config, baseUrl));
        contentType = 'application/json';
        break;
      case 'csv':
        content = buildCsvFeed(filteredProperties, config, baseUrl);
        contentType = 'text/csv';
        break;
      default:
        content = buildXmlFeed(filteredProperties, config, baseUrl);
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
