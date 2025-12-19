import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  [key: string]: string;
}

interface ImportStats {
  totalProcessed: number;
  withPrice: number;
  withDescription: number;
  withSpecs: number;
  withVagas: number;
  problems: Array<{
    title: string;
    permalink: string;
    issues: string[];
  }>;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function parseLocation(estadoCidade: string): { estado: string; cidade: string } {
  if (!estadoCidade) return { estado: '', cidade: '' };
  
  const parts = estadoCidade.split('>').map(p => p.trim());
  return {
    estado: parts[0] || '',
    cidade: parts[1] || ''
  };
}

function mapPropertyType(tipo: string): string {
  const typeMap: Record<string, string> = {
    'Casa': 'casa',
    'Apartamento': 'apartamento',
    'Terreno': 'terreno',
    'Comercial': 'comercial',
    'Rural': 'rural',
    'Chácara': 'rural',
    'Fazenda': 'rural',
    'Sítio': 'rural',
    'Cobertura': 'cobertura',
    'Flat': 'flat',
    'Galpão': 'galpao',
    'Galpao': 'galpao',
    'Loja': 'comercial',
    'Sala': 'comercial',
  };
  
  return typeMap[tipo] || 'casa';
}

function mapPropertyStatus(finalidade: string): string {
  const statusMap: Record<string, string> = {
    'Venda': 'venda',
    'Aluguel': 'aluguel',
    'Vendido': 'vendido',
    'Alugado': 'alugado',
  };
  
  return statusMap[finalidade] || 'venda';
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Parse Brazilian number format (1.000,50 -> 1000.50)
 * Correctly handles "0" as a valid number
 */
function parseBrazilianNumber(value: string): number | null {
  if (value === null || value === undefined) return null;
  
  const trimmed = String(value).trim();
  
  // Handle empty string
  if (trimmed === '') return null;
  
  // Handle "0" explicitly - this is a valid number
  if (trimmed === '0' || trimmed === '0.00' || trimmed === '0,00') return 0;
  
  // Remove everything except digits, dots, and commas
  let cleaned = trimmed.replace(/[^\d.,\-]/g, '');
  if (!cleaned) return null;
  
  // Check format
  const hasBrazilianFormat = cleaned.includes('.') && cleaned.includes(',');
  const hasOnlyComma = !cleaned.includes('.') && cleaned.includes(',');
  const hasOnlyDot = cleaned.includes('.') && !cleaned.includes(',');
  
  if (hasBrazilianFormat) {
    // Brazilian: 1.000,50 -> remove dots, replace comma
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasOnlyComma) {
    // 1000,50 -> replace comma with dot
    cleaned = cleaned.replace(',', '.');
  } else if (hasOnlyDot) {
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots = thousands: 1.000.000 -> 1000000
      cleaned = cleaned.replace(/\./g, '');
    }
    // Single dot stays as decimal
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse price from various formats:
 * - R$ 1.350.000,00
 * - 1.350.000,00
 * - 1350000
 * - 1350000.00
 * - 1350000,00
 * - 0 (valid for "preço sob consulta")
 */
function parsePrice(value: string): number | null {
  if (value === null || value === undefined) return null;
  
  const trimmed = String(value).trim();
  
  // Handle empty string
  if (trimmed === '') return null;
  
  // Handle "0" explicitly - this is valid (terrenos/preço sob consulta)
  if (trimmed === '0' || trimmed === '0.00' || trimmed === '0,00') return 0;
  
  // Remove R$, spaces and currency symbols
  const cleaned = trimmed.replace(/R\$|\s/g, '').trim();
  if (!cleaned) return null;
  
  const num = parseBrazilianNumber(cleaned);
  return num !== null && num >= 0 ? num : null;
}

/**
 * Extract price from Content/description text using regex
 */
function extractPriceFromContent(content: string): number | null {
  if (!content) return null;
  
  // Match patterns like "R$ 480.000,00" or "R$ 1.350.000" or "Valor: R$ 480.000"
  const patterns = [
    /R\$\s*([\d.,]+)/gi,
    /(?:valor|preço|price)[\s:]*R?\$?\s*([\d.,]+)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const price = parsePrice(match[1]);
      if (price && price > 1000) { // Minimum reasonable price
        return price;
      }
    }
  }
  
  return null;
}

/**
 * Clean HTML and convert to readable text with line breaks
 */
function cleanHtmlToText(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // Convert block elements to line breaks
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  
  // Add line break before list items
  text = text.replace(/<li[^>]*>/gi, '• ');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&apos;/gi, "'");
  
  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

/**
 * Extract specifications from Content text
 */
function extractSpecsFromContent(content: string): {
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area: number | null;
  areaConstructed: number | null;
} {
  const specs = {
    quartos: 0,
    suites: 0,
    banheiros: 0,
    vagas: 0,
    area: null as number | null,
    areaConstructed: null as number | null,
  };
  
  if (!content) return specs;
  
  // Normalize text for matching
  const text = content.toLowerCase();
  
  // Quartos patterns
  const quartosPatterns = [
    /(\d+)\s*(?:quartos?|dormit[oó]rios?|dorms?)/i,
    /(?:quartos?|dormit[oó]rios?)[\s:]*(\d+)/i,
  ];
  for (const pattern of quartosPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs.quartos = parseInt(match[1], 10);
      break;
    }
  }
  
  // Suítes patterns
  const suitesPatterns = [
    /(\d+)\s*su[ií]tes?/i,
    /su[ií]tes?[\s:]*(\d+)/i,
  ];
  for (const pattern of suitesPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs.suites = parseInt(match[1], 10);
      break;
    }
  }
  
  // Banheiros patterns
  const banheirosPatterns = [
    /(\d+)\s*(?:banheiros?|wc|lavabos?)/i,
    /(?:banheiros?|wc)[\s:]*(\d+)/i,
  ];
  for (const pattern of banheirosPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs.banheiros = parseInt(match[1], 10);
      break;
    }
  }
  
  // Vagas patterns - more comprehensive matching
  const vagasPatterns = [
    /(\d+)\s*vagas?/i,                                    // "2 vagas", "1 vaga"
    /(\d+)\s*garagens?/i,                                 // "2 garagens"
    /(?:vagas?|garagem|garagens?)[\s:]*(\d+)/i,           // "vagas: 2", "garagem: 1"
    /garagem\s*(?:para|com|coberta\s+para|coberta\s+com)?\s*(\d+)/i,  // "garagem para 2 carros"
    /vaga\s*de\s*garagem/i,                               // "vaga de garagem" = 1
    /(\d+)\s*(?:carros?|ve[ií]culos?)/i,                  // "3 carros", "2 veículos"
  ];
  for (const pattern of vagasPatterns) {
    const match = text.match(pattern);
    if (match) {
      // "vaga de garagem" without number = 1
      if (/vaga\s*de\s*garagem/i.test(match[0]) && !match[1]) {
        specs.vagas = 1;
      } else if (match[1]) {
        specs.vagas = parseInt(match[1], 10);
      }
      if (specs.vagas > 0) break;
    }
  }
  
  // Área total patterns - support "1.000 m²", "1000m2", "1000 m2", "Área: 1.000m²"
  const areaPatterns = [
    /[áa]rea\s*(?:total)?[\s:]*([0-9.,]+)\s*(?:m[²2]|metros?)/i,
    /([0-9.,]+)\s*(?:m[²2]|metros?)\s*(?:de\s+)?(?:total|terreno)/i,
    /terreno[\s:]*([0-9.,]+)\s*(?:m[²2]|metros?)/i,
  ];
  for (const pattern of areaPatterns) {
    const match = content.match(pattern);
    if (match) {
      const area = parseBrazilianNumber(match[1]);
      if (area && area > 0) {
        specs.area = area;
        break;
      }
    }
  }
  
  // Área construída patterns
  const areaConstPatterns = [
    /[áa]rea\s*constru[ií]da[\s:]*([0-9.,]+)\s*(?:m[²2]|metros?)/i,
    /constru[ií]da[\s:]*([0-9.,]+)\s*(?:m[²2]|metros?)/i,
    /([0-9.,]+)\s*(?:m[²2]|metros?)\s*constru[ií]d[ao]s?/i,
  ];
  for (const pattern of areaConstPatterns) {
    const match = content.match(pattern);
    if (match) {
      const area = parseBrazilianNumber(match[1]);
      if (area && area > 0) {
        specs.areaConstructed = area;
        break;
      }
    }
  }
  
  return specs;
}

function parseIntValue(value: string): number {
  if (!value) return 0;
  const num = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  propertySlug: string,
  index: number
): Promise<string | null> {
  try {
    console.log(`Downloading image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const urlPath = new URL(imageUrl).pathname;
    let ext = urlPath.split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      ext = 'jpg';
    }
    
    const fileName = `${propertySlug}/${propertySlug}-${index}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, uint8Array, {
        contentType,
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Failed to upload image: ${uploadError.message}`);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);
    
    console.log(`Image uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error processing image: ${error}`);
    return null;
  }
}

// Process a single property (for background processing)
async function processProperty(
  supabase: any,
  row: CSVRow,
  lineNumber: number
): Promise<{ 
  success: boolean; 
  created: boolean; 
  updated: boolean; 
  imagesCount: number; 
  hasPrice: boolean;
  hasDescription: boolean;
  hasSpecs: boolean;
  issues: string[];
  error?: string;
}> {
  const issues: string[] = [];
  
  try {
    // ALWAYS use Title column - never generate from Content
    const title = row['Title'] || row['title'] || '';
    if (!title) {
      return { 
        success: false, created: false, updated: false, imagesCount: 0, 
        hasPrice: false, hasDescription: false, hasSpecs: false,
        issues: ['Título vazio'], error: 'Título vazio' 
      };
    }
    
    const permalink = row['Permalink'] || row['permalink'] || '';
    const slug = row['Slug'] || row['slug'] || generateSlug(title);
    
    // Get Content and clean HTML - check multiple column names
    // Priority: Content (WordPress post_content) > descricao > Description > Excerpt
    const contentRaw = row['Content'] || row['content'] || row['post_content'] || 
                       row['Descricao'] || row['descricao'] || row['Descrição'] || row['descrição'] ||
                       row['Description'] || row['description'] ||
                       row['Excerpt'] || row['excerpt'] || '';
    
    const description = cleanHtmlToText(contentRaw);
    const hasDescription = description.length > 10; // Minimum 10 chars for meaningful description
    
    // Log if Content column exists but is empty
    if (!hasDescription) {
      if (row['Content'] !== undefined || row['content'] !== undefined) {
        console.log(`Content column found but empty/short for: ${title}`);
      }
      issues.push('Sem descrição');
    } else {
      console.log(`Description imported: ${description.length} chars for ${title}`);
    }
    
    const estadoCidade = row['Estado e Cidade'] || row['estado_cidade'] || '';
    const { estado, cidade } = parseLocation(estadoCidade);
    
    const tipo = row['Tipo do Imóvel'] || row['tipo'] || 'Casa';
    const finalidade = row['Finalidade'] || row['finalidade'] || 'Venda';
    const destaque = (row['Destaque'] || '').toLowerCase() === 'destaque';
    
    // === PRICE HANDLING ===
    // 1. Try explicit price column first
    const precoRaw = row['Preço'] || row['preco'] || row['Price'] || row['price'] || '';
    let preco = parsePrice(precoRaw);
    
    // 2. If no price column, try to extract from Content
    if (preco === null && contentRaw) {
      preco = extractPriceFromContent(contentRaw);
      if (preco) {
        console.log(`Extracted price from content: ${preco}`);
      }
    }
    
    const hasPrice = preco !== null && preco > 0;
    if (!hasPrice) {
      issues.push('Sem preço');
    }
    
    // === SPECS HANDLING ===
    // Try explicit columns first, then extract from Content
    let quartos = parseIntValue(row['Quartos'] || row['quartos'] || row['Bedrooms'] || '');
    let suites = parseIntValue(row['Suítes'] || row['suites'] || row['Suites'] || '');
    let banheiros = parseIntValue(row['Banheiros'] || row['banheiros'] || row['Bathrooms'] || '');
    
    // Vagas: check multiple column names explicitly
    let vagas = parseIntValue(
      row['Vagas'] || row['vagas'] || 
      row['Garagem'] || row['garagem'] || 
      row['Garagens'] || row['garagens'] ||
      row['Garages'] || row['garages'] ||
      row['Parking'] || row['parking'] || ''
    );
    
    let area = parseBrazilianNumber(row['Área'] || row['area'] || row['Area'] || row['Área Total'] || '');
    let areaConstructed = parseBrazilianNumber(row['Área Construída'] || row['area_construida'] || row['Built Area'] || '');
    
    // Extract from Content for any missing spec individually (not all-or-nothing)
    const extractedSpecs = extractSpecsFromContent(contentRaw);
    
    if (quartos === 0 && extractedSpecs.quartos > 0) {
      quartos = extractedSpecs.quartos;
      console.log(`Extracted quartos from content: ${quartos}`);
    }
    if (suites === 0 && extractedSpecs.suites > 0) {
      suites = extractedSpecs.suites;
      console.log(`Extracted suites from content: ${suites}`);
    }
    if (banheiros === 0 && extractedSpecs.banheiros > 0) {
      banheiros = extractedSpecs.banheiros;
      console.log(`Extracted banheiros from content: ${banheiros}`);
    }
    if (vagas === 0 && extractedSpecs.vagas > 0) {
      vagas = extractedSpecs.vagas;
      console.log(`Extracted vagas from content: ${vagas}`);
    }
    if (!area && extractedSpecs.area) {
      area = extractedSpecs.area;
      console.log(`Extracted area from content: ${area}`);
    }
    if (!areaConstructed && extractedSpecs.areaConstructed) {
      areaConstructed = extractedSpecs.areaConstructed;
      console.log(`Extracted areaConstructed from content: ${areaConstructed}`);
    }
    
    const hasVagas = vagas > 0;
    const hasSpecs = quartos > 0 || suites > 0 || banheiros > 0 || vagas > 0 || (area !== null && area > 0);
    
    if (!hasSpecs) {
      issues.push('Sem especificações');
    }
    if (!hasVagas) {
      issues.push('Sem vagas');
    }
    
    // Get additional address fields
    const bairro = row['Bairro'] || row['bairro'] || row['Neighborhood'] || '';
    const rua = row['Rua'] || row['rua'] || row['Street'] || row['Endereço'] || '';
    const cep = row['CEP'] || row['cep'] || row['Zipcode'] || '';
    const latitude = parseBrazilianNumber(row['Latitude'] || row['latitude'] || row['Lat'] || '');
    const longitude = parseBrazilianNumber(row['Longitude'] || row['longitude'] || row['Lng'] || '');
    
    // Get additional property fields
    const referencia = row['Referência'] || row['referencia'] || row['Reference'] || '';
    const perfil = row['Perfil'] || row['perfil'] || 'residencial';
    const condominio = parseBrazilianNumber(row['Condomínio'] || row['condominio'] || row['Condo'] || '');
    const condominioIsento = (row['Condomínio Isento'] || row['condominio_isento'] || '').toLowerCase() === 'sim';
    const iptu = parseBrazilianNumber(row['IPTU'] || row['iptu'] || '');
    const financiamento = (row['Financiamento'] || row['financiamento'] || '').toLowerCase() === 'sim';
    const documentacao = row['Documentação'] || row['documentacao'] || 'regular';
    const ativo = row['Ativo'] ? (row['Ativo'].toLowerCase() === 'sim') : true;
    const seoTitulo = row['SEO Título'] || row['seo_titulo'] || '';
    const seoDescricao = row['SEO Descrição'] || row['seo_descricao'] || '';
    
    // Build property data
    const propertyData: Record<string, unknown> = {
      title,
      slug,
      description,
      address_state: estado,
      address_city: cidade,
      address_neighborhood: bairro,
      address_street: rua,
      address_zipcode: cep,
      address_lat: latitude,
      address_lng: longitude,
      type: mapPropertyType(tipo),
      status: mapPropertyStatus(finalidade),
      profile: perfil,
      featured: destaque,
      old_url: permalink,
      bedrooms: quartos,
      suites: suites,
      bathrooms: banheiros,
      garages: vagas,
      area: area || 0,
      built_area: areaConstructed,
      condo_fee: condominio,
      condo_exempt: condominioIsento,
      iptu: iptu,
      financing: financiamento,
      documentation: documentacao,
      active: ativo,
      reference: referencia,
      seo_title: seoTitulo,
      seo_description: seoDescricao,
      updated_at: new Date().toISOString()
    };
    
    // Always set price if parsed successfully (don't overwrite existing with 0)
    if (preco !== null) {
      propertyData.price = preco;
    }
    
    console.log(`Processing: ${title} (${slug}) - Price: ${preco !== null ? preco : 'not set'}, Description: ${description.length} chars, Specs: q=${quartos} s=${suites} b=${banheiros} v=${vagas} a=${area}`);
    
    // Check if property exists by slug or old_url (permalink)
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .or(`slug.eq.${slug},old_url.eq.${permalink}`)
      .maybeSingle();
    
    let propertyId: string;
    let created = false;
    let updated = false;
    
    if (existingProperty) {
      const { error: updateError } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', existingProperty.id);
      
      if (updateError) throw new Error(`Update error: ${updateError.message}`);
      
      propertyId = existingProperty.id;
      updated = true;
      
      // Delete existing images for re-import
      await supabase.from('property_images').delete().eq('property_id', propertyId);
    } else {
      const { data: newProperty, error: insertError } = await supabase
        .from('properties')
        .insert({ ...propertyData, created_at: new Date().toISOString() })
        .select('id')
        .single();
      
      if (insertError) throw new Error(`Insert error: ${insertError.message}`);
      
      propertyId = newProperty.id;
      created = true;
    }
    
    // Process images - support multiple URLs separated by "|" (WP All Export) or ", " (Lovable export)
    const imageUrlsRaw = row['Image URL'] || row['image_url'] || row['Attachment URL'] || row['Imagens'] || '';
    const imageUrls = imageUrlsRaw
      .split(/[|,]/)
      .map(url => url.trim())
      .filter(url => url.startsWith('http'));
    
    console.log(`Found ${imageUrls.length} images for ${title}`);
    
    // Process all images - first image is cover, rest are gallery
    let imagesCount = 0;
    for (let imgIndex = 0; imgIndex < imageUrls.length; imgIndex++) {
      const uploadedUrl = await downloadAndUploadImage(supabase, imageUrls[imgIndex], slug, imgIndex);
      
      if (uploadedUrl) {
        const { error: imgError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            url: uploadedUrl,
            order_index: imgIndex, // First image (index 0) is cover
            alt: imgIndex === 0 ? `${title} - Capa` : `${title} - Imagem ${imgIndex + 1}`
          });
        
        if (!imgError) imagesCount++;
      }
    }
    
    // Property can be saved even without images
    return { 
      success: true, created, updated, imagesCount, 
      hasPrice, hasDescription, hasSpecs, hasVagas, issues 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error line ${lineNumber}: ${errorMessage}`);
    return { 
      success: false, created: false, updated: false, imagesCount: 0, 
      hasPrice: false, hasDescription: false, hasSpecs: false, hasVagas: false,
      issues, error: errorMessage 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem importar.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse CSV
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    console.log(`Starting import of ${rows.length} properties`);
    
    // Create import job record for tracking progress
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        status: 'processing',
        total_items: rows.length,
        processed_items: 0,
        created_items: 0,
        updated_items: 0,
        error_count: 0,
        errors: []
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error('Error creating import job:', jobError);
    }
    
    const jobId = importJob?.id;
    
    // Process in background using waitUntil
    const backgroundTask = async () => {
      let criados = 0;
      let atualizados = 0;
      let imagensImportadas = 0;
      let withPrice = 0;
      let withDescription = 0;
      let withSpecs = 0;
      let withVagas = 0;
      const erros: Array<{ linha: number; titulo: string; motivo: string }> = [];
      const problemProperties: Array<{ title: string; permalink: string; issues: string[] }> = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNumber = i + 2;
        
        const result = await processProperty(supabase, row, lineNumber);
        
        if (result.success) {
          if (result.created) criados++;
          if (result.updated) atualizados++;
          imagensImportadas += result.imagesCount;
          if (result.hasPrice) withPrice++;
          if (result.hasDescription) withDescription++;
          if (result.hasSpecs) withSpecs++;
          if (result.hasVagas) withVagas++;
          
          // Track properties with issues even if successfully imported
          if (result.issues.length > 0) {
            problemProperties.push({
              title: row['Title'] || row['title'] || 'Desconhecido',
              permalink: row['Permalink'] || row['permalink'] || '',
              issues: result.issues
            });
          }
        } else {
          erros.push({
            linha: lineNumber,
            titulo: row['Title'] || row['title'] || 'Desconhecido',
            motivo: result.error || 'Erro desconhecido'
          });
        }
        
        // Update progress every 1 item or at the end
        if (jobId && (i % 1 === 0 || i === rows.length - 1)) {
          await supabase
            .from('import_jobs')
            .update({
              processed_items: i + 1,
              created_items: criados,
              updated_items: atualizados,
              error_count: erros.length,
              errors: {
                erros: erros.slice(-10),
                stats: {
                  withPrice,
                  withDescription,
                  withSpecs,
                  withVagas,
                  totalProcessed: i + 1
                },
                problemProperties: problemProperties.slice(-20)
              }
            })
            .eq('id', jobId);
        }
      }
      
      // Mark as completed with full stats
      if (jobId) {
        await supabase
          .from('import_jobs')
          .update({
            status: 'completed',
            processed_items: rows.length,
            created_items: criados,
            updated_items: atualizados,
            error_count: erros.length,
            errors: {
              erros,
              stats: {
                withPrice,
                withDescription,
                withSpecs,
                withVagas,
                totalProcessed: rows.length,
                imagensImportadas
              },
              problemProperties
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
      
      console.log(`Import completed: ${criados} created, ${atualizados} updated, ${imagensImportadas} images, ${erros.length} errors`);
      console.log(`Stats: ${withPrice} with price, ${withDescription} with description, ${withSpecs} with specs, ${withVagas} with vagas`);
    };
    
    // Start background processing
    EdgeRuntime.waitUntil(backgroundTask());
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Importação iniciada',
        jobId,
        totalRows: rows.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao processar arquivo' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
