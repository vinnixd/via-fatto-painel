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

/**
 * Split CSV text into records, preserving quoted fields with newlines
 * This function handles multi-line fields correctly by tracking quote state
 */
function splitCSVRecords(csvText: string): string[] {
  const records: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    
    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        current += '""';  // Preserva aspas escapadas
        i++;
      } else {
        inQuotes = !inQuotes;
        current += '"';   // Preserva a aspa no output
      }
      continue;
    }
    
    if (char === '\n' && !inQuotes) {
      if (current.trim()) {
        records.push(current);
      }
      current = '';
      continue;
    }
    
    // Handle \r\n (Windows line endings)
    if (char === '\r' && csvText[i + 1] === '\n' && !inQuotes) {
      if (current.trim()) {
        records.push(current);
      }
      current = '';
      i++; // Skip the \n
      continue;
    }
    
    current += char;
  }
  
  // Don't forget the last record
  if (current.trim()) {
    records.push(current);
  }
  
  return records;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = splitCSVRecords(csvText);
  if (lines.length < 2) return [];
  
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  console.log(`[parseCSV] Headers found: ${headers.join(', ')}`);
  console.log(`[parseCSV] Total records (excluding header): ${lines.length - 1}`);
  
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    
    // Log warning if column count doesn't match
    if (values.length !== headers.length) {
      console.warn(`[parseCSV] Line ${i}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
    }
    
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      // Use ?? instead of || to preserve "0" values
      const val = values[index];
      row[header.trim()] = val !== null && val !== undefined ? val.trim() : '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Get value from CSV row - handles multiple column name variants
 * Uses nullish coalescing to preserve "0" values
 */
function getRowValue(row: CSVRow, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key];
    if (val !== null && val !== undefined && val !== '') {
      return val;
    }
  }
  return '';
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

function mapPropertyCondition(condition: string): string | null {
  if (!condition) return null;
  
  const conditionMap: Record<string, string> = {
    'Lançamento': 'lancamento',
    'lancamento': 'lancamento',
    'Novo': 'novo',
    'novo': 'novo',
    'Usado': 'usado',
    'usado': 'usado',
    'Pronto para Morar': 'pronto_para_morar',
    'pronto_para_morar': 'pronto_para_morar',
    'Pronto para morar': 'pronto_para_morar',
  };
  
  return conditionMap[condition] || null;
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

/**
 * Parse integer value - handles "0" correctly
 */
function parseIntValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  
  const strValue = String(value).trim();
  
  // Empty string returns 0
  if (strValue === '') return 0;
  
  // Handle "0" explicitly
  if (strValue === '0') return 0;
  
  // Remove non-digit characters and parse
  const cleaned = strValue.replace(/[^\d]/g, '');
  if (cleaned === '') return 0;
  
  const num = Number.parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  propertySlug: string,
  index: number,
  timeoutMs: number = 10000 // 10 second timeout per image
): Promise<string | null> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to download image ${index}: ${response.status}`);
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
      console.error(`Failed to upload image ${index}: ${uploadError.message}`);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Image ${index} download timed out`);
    } else {
      console.error(`Error processing image ${index}: ${error}`);
    }
    return null;
  }
}

/**
 * Process images in parallel with concurrency limit
 */
async function processImagesInParallel(
  supabase: any,
  imageUrls: string[],
  propertySlug: string,
  propertyId: string,
  title: string,
  maxConcurrent: number = 3, // Process 3 images at a time
  maxImages: number = 10 // Limit to first 10 images per property
): Promise<number> {
  // Limit number of images to prevent timeout
  const urlsToProcess = imageUrls.slice(0, maxImages);
  let imagesCount = 0;
  
  // Process in batches
  for (let i = 0; i < urlsToProcess.length; i += maxConcurrent) {
    const batch = urlsToProcess.slice(i, i + maxConcurrent);
    
    const results = await Promise.allSettled(
      batch.map(async (url, batchIndex) => {
        const imgIndex = i + batchIndex;
        const uploadedUrl = await downloadAndUploadImage(supabase, url, propertySlug, imgIndex);
        
        if (uploadedUrl) {
          const { error: imgError } = await supabase
            .from('property_images')
            .insert({
              property_id: propertyId,
              url: uploadedUrl,
              order_index: imgIndex,
              alt: imgIndex === 0 ? `${title} - Capa` : `${title} - Imagem ${imgIndex + 1}`
            });
          
          if (!imgError) return true;
        }
        return false;
      })
    );
    
    imagesCount += results.filter(r => r.status === 'fulfilled' && r.value).length;
  }
  
  return imagesCount;
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
  hasVagas: boolean;
  issues: string[];
  error?: string;
}> {
  const issues: string[] = [];
  
  try {
    // ========== DEBUG: Log all CSV columns for this row ==========
    console.log(`\n========== PROCESSING ROW ${lineNumber} ==========`);
    console.log('CSV Columns available:', Object.keys(row).join(', '));
    
    // Log raw values for key fields to debug mapping issues
    const debugFields = [
      'Title', 'title', 'Slug', 'Permalink',
      'Content', 'Descricao', 'Descrição', 'Description',
      'Preço', 'preco', 'Price',
      'Quartos', 'quartos', 'Bedrooms',
      'Suítes', 'suites',
      'Banheiros', 'banheiros',
      'Vagas', 'vagas', 'Garagem', 'garagem',
      'Área Total', 'Área', 'area',
      'Área Construída',
      'Estado e Cidade', 'Bairro', 'Rua', 'CEP',
      'Tipo do Imóvel', 'Finalidade',
      'Características', 'Amenidades',
      'Image URL', 'Imagens'
    ];
    
    console.log('--- RAW FIELD VALUES ---');
    for (const field of debugFields) {
      if (row[field] !== undefined && row[field] !== '') {
        const value = String(row[field]).substring(0, 100); // Truncate long values
        console.log(`  ${field}: "${value}"${row[field].length > 100 ? '...' : ''}`);
      }
    }
    console.log('------------------------');
    
    // ALWAYS use Title column - never generate from Content
    const title = row['Title'] || row['title'] || '';
    if (!title) {
      console.log(`[ERROR] Row ${lineNumber}: Missing title`);
      return { 
        success: false, created: false, updated: false, imagesCount: 0, 
        hasPrice: false, hasDescription: false, hasSpecs: false, hasVagas: false,
        issues: ['Título vazio'], error: 'Título vazio' 
      };
    }
    
    const permalink = row['Permalink'] || row['permalink'] || '';
    const slug = row['Slug'] || row['slug'] || generateSlug(title);
    console.log(`[MAPPED] Title: "${title}" | Slug: "${slug}"`);
    
    // Get Content and clean HTML - check multiple column names
    // Priority: Content (WordPress post_content) > descricao > Description > Excerpt
    const contentRaw = row['Content'] || row['content'] || row['post_content'] || 
                       row['Descricao'] || row['descricao'] || row['Descrição'] || row['descrição'] ||
                       row['Description'] || row['description'] ||
                       row['Excerpt'] || row['excerpt'] || '';
    
    const description = cleanHtmlToText(contentRaw);
    const hasDescription = description.length > 10;
    console.log(`[MAPPED] Description: ${description.length} chars (hasDescription: ${hasDescription})`);
    
    if (!hasDescription) {
      issues.push('Sem descrição');
    }
    
    const estadoCidade = row['Estado e Cidade'] || row['estado_cidade'] || '';
    const { estado, cidade } = parseLocation(estadoCidade);
    const bairro = getRowValue(row, 'Bairro', 'bairro', 'Neighborhood');
    const rua = getRowValue(row, 'Rua', 'rua', 'Street', 'Endereço');
    console.log(`[MAPPED] Location: Estado="${estado}" Cidade="${cidade}" Bairro="${bairro}" Rua="${rua}"`);
    
    const tipo = row['Tipo do Imóvel'] || row['tipo'] || 'Casa';
    const finalidade = row['Finalidade'] || row['finalidade'] || 'Venda';
    const destaque = (row['Destaque'] || '').toLowerCase() === 'destaque';
    console.log(`[MAPPED] Type: "${tipo}" -> "${mapPropertyType(tipo)}" | Status: "${finalidade}" -> "${mapPropertyStatus(finalidade)}" | Featured: ${destaque}`);
    
    // === PRICE HANDLING ===
    // 1. Try explicit price column first - use getRowValue to handle "0" correctly
    const precoRaw = getRowValue(row, 'Preço', 'preco', 'Price', 'price');
    let preco = parsePrice(precoRaw);
    console.log(`[MAPPED] Price: raw="${precoRaw}" -> parsed=${preco}`);
    
    // 2. If no price column, try to extract from Content
    if (preco === null && contentRaw) {
      preco = extractPriceFromContent(contentRaw);
      if (preco) {
        console.log(`[EXTRACTED] Price from content: ${preco}`);
      }
    }
    
    const hasPrice = preco !== null && preco > 0;
    if (!hasPrice) {
      issues.push('Sem preço');
    }
    
    // === SPECS HANDLING ===
    // Try explicit columns first, then extract from Content
    // Use getRowValue to properly handle "0" values
    const quartosRaw = getRowValue(row, 'Quartos', 'quartos', 'Bedrooms');
    let quartos = parseIntValue(quartosRaw);
    
    const suitesRaw = getRowValue(row, 'Suítes', 'suites', 'Suites');
    let suites = parseIntValue(suitesRaw);
    
    const banheirosRaw = getRowValue(row, 'Banheiros', 'banheiros', 'Bathrooms');
    let banheiros = parseIntValue(banheirosRaw);
    
    // Vagas: check multiple column names explicitly
    const vagasRaw = getRowValue(row, 
      'Vagas', 'vagas', 
      'Garagem', 'garagem', 
      'Garagens', 'garagens',
      'Garages', 'garages',
      'Parking', 'parking'
    );
    let vagas = parseIntValue(vagasRaw);
    
    const areaRaw = getRowValue(row, 'Área Total', 'Área', 'area', 'Area');
    let area = parseBrazilianNumber(areaRaw);
    
    const areaConstructedRaw = getRowValue(row, 'Área Construída', 'area_construida', 'Built Area');
    let areaConstructed = parseBrazilianNumber(areaConstructedRaw);
    
    console.log(`[MAPPED] Specs RAW: Quartos="${quartosRaw}" Suítes="${suitesRaw}" Banheiros="${banheirosRaw}" Vagas="${vagasRaw}" Área="${areaRaw}" ÁreaConstr="${areaConstructedRaw}"`);
    console.log(`[MAPPED] Specs PARSED: Quartos=${quartos} Suítes=${suites} Banheiros=${banheiros} Vagas=${vagas} Área=${area} ÁreaConstr=${areaConstructed}`);
    
    // Extract from Content for any missing spec individually (not all-or-nothing)
    const extractedSpecs = extractSpecsFromContent(contentRaw);
    
    if (quartos === 0 && extractedSpecs.quartos > 0) {
      quartos = extractedSpecs.quartos;
      console.log(`[EXTRACTED] Quartos from content: ${quartos}`);
    }
    if (suites === 0 && extractedSpecs.suites > 0) {
      suites = extractedSpecs.suites;
      console.log(`[EXTRACTED] Suítes from content: ${suites}`);
    }
    if (banheiros === 0 && extractedSpecs.banheiros > 0) {
      banheiros = extractedSpecs.banheiros;
      console.log(`[EXTRACTED] Banheiros from content: ${banheiros}`);
    }
    if (vagas === 0 && extractedSpecs.vagas > 0) {
      vagas = extractedSpecs.vagas;
      console.log(`[EXTRACTED] Vagas from content: ${vagas}`);
    }
    if (!area && extractedSpecs.area) {
      area = extractedSpecs.area;
      console.log(`[EXTRACTED] Área from content: ${area}`);
    }
    if (!areaConstructed && extractedSpecs.areaConstructed) {
      areaConstructed = extractedSpecs.areaConstructed;
      console.log(`[EXTRACTED] Área Construída from content: ${areaConstructed}`);
    }
    
    const hasVagas = vagas > 0;
    const hasSpecs = quartos > 0 || suites > 0 || banheiros > 0 || vagas > 0 || (area !== null && area > 0);
    
    if (!hasSpecs) {
      issues.push('Sem especificações');
    }
    if (!hasVagas) {
      issues.push('Sem vagas');
    }
    
    // Get additional address fields - use getRowValue for proper handling
    const cep = getRowValue(row, 'CEP', 'cep', 'Zipcode');
    const latitude = parseBrazilianNumber(getRowValue(row, 'Latitude', 'latitude', 'Lat'));
    const longitude = parseBrazilianNumber(getRowValue(row, 'Longitude', 'longitude', 'Lng'));
    console.log(`[MAPPED] Address extra: CEP="${cep}" Lat=${latitude} Lng=${longitude}`);
    
    // Get additional property fields - use getRowValue for proper "0" handling
    const referencia = getRowValue(row, 'Referência', 'referencia', 'Reference');
    const perfil = getRowValue(row, 'Perfil', 'perfil') || 'residencial';
    const condominioRaw = getRowValue(row, 'Condomínio', 'condominio', 'Condo');
    const condominio = parseBrazilianNumber(condominioRaw);
    const condominioIsentoRaw = getRowValue(row, 'Condomínio Isento', 'condominio_isento');
    const condominioIsento = condominioIsentoRaw.toLowerCase() === 'sim';
    const iptuRaw = getRowValue(row, 'IPTU', 'iptu');
    const iptu = parseBrazilianNumber(iptuRaw);
    const financiamentoRaw = getRowValue(row, 'Financiamento', 'financiamento');
    const financiamento = financiamentoRaw.toLowerCase() === 'sim';
    const documentacao = getRowValue(row, 'Documentação', 'documentacao') || 'regular';
    const ativoRaw = getRowValue(row, 'Ativo', 'ativo');
    const ativo = ativoRaw ? ativoRaw.toLowerCase() === 'sim' : true;
    const seoTitulo = getRowValue(row, 'SEO Título', 'seo_titulo');
    const seoDescricao = getRowValue(row, 'SEO Descrição', 'seo_descricao');
    
    // Estado de Conservação (condition)
    const conservacaoRaw = getRowValue(row, 'Estado de Conservação', 'estado_conservacao', 'Condition', 'condition');
    const conservacao = mapPropertyCondition(conservacaoRaw);
    
    // Tipo de Localização (location_type)
    const localizacaoTipoRaw = getRowValue(row, 'Tipo de Localização', 'tipo_localizacao', 'Location Type');
    const localizacaoTipo = localizacaoTipoRaw || 'approximate';
    
    console.log(`[MAPPED] Extra fields: Ref="${referencia}" Perfil="${perfil}" Condo=${condominio} CondoIsento=${condominioIsento} IPTU=${iptu} Financ=${financiamento} Doc="${documentacao}" Ativo=${ativo} Conservação="${conservacao}" LocTipo="${localizacaoTipo}"`);
    
    // Features and Amenities - split by ";" (semicolon) as exported
    const caracteristicasRaw = getRowValue(row, 'Características', 'caracteristicas', 'Features');
    const features = caracteristicasRaw 
      ? caracteristicasRaw.split(';').map(f => f.trim()).filter(f => f.length > 0)
      : [];
    
    const amenidadesRaw = getRowValue(row, 'Amenidades', 'amenidades', 'Amenities');
    const amenities = amenidadesRaw
      ? amenidadesRaw.split(';').map(a => a.trim()).filter(a => a.length > 0)
      : [];
    
    console.log(`[MAPPED] Features: raw="${caracteristicasRaw?.substring(0, 50) || ''}" -> ${features.length} items`);
    console.log(`[MAPPED] Amenities: raw="${amenidadesRaw?.substring(0, 50) || ''}" -> ${amenities.length} items`);
    
    
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
      features: features.length > 0 ? features : null,
      amenities: amenities.length > 0 ? amenities : null,
      condo_fee: condominio,
      condo_exempt: condominioIsento,
      iptu: iptu,
      financing: financiamento,
      documentation: documentacao,
      active: ativo,
      reference: referencia,
      condition: conservacao,
      location_type: localizacaoTipo,
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
    console.log(`[MAPPED] Images: ${imageUrlsRaw.length} chars`);
    
    const imageUrls = imageUrlsRaw
      .split(/[|,]/)
      .map(url => url.trim())
      .filter(url => url.startsWith('http'));
    
    console.log(`[MAPPED] Images PARSED: ${imageUrls.length} valid URLs found`);
    
    // Process images in parallel with limits to prevent timeout
    const imagesCount = await processImagesInParallel(
      supabase, 
      imageUrls, 
      slug, 
      propertyId, 
      title,
      3,  // 3 concurrent downloads
      10  // Max 10 images per property
    );
    
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
    
    // Process in background using waitUntil - with parallel batches for speed
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
      
      const BATCH_SIZE = 5; // Process 5 properties in parallel
      
      for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
        const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
        
        console.log(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)} (items ${batchStart + 1}-${batchStart + batch.length})`);
        
        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map((row, batchIndex) => {
            const lineNumber = batchStart + batchIndex + 2;
            return processProperty(supabase, row, lineNumber)
              .then(result => ({ result, row, lineNumber }));
          })
        );
        
        // Collect results
        for (const settled of batchResults) {
          if (settled.status === 'fulfilled') {
            const { result, row, lineNumber } = settled.value;
            
            if (result.success) {
              if (result.created) criados++;
              if (result.updated) atualizados++;
              imagensImportadas += result.imagesCount;
              if (result.hasPrice) withPrice++;
              if (result.hasDescription) withDescription++;
              if (result.hasSpecs) withSpecs++;
              if (result.hasVagas) withVagas++;
              
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
          } else {
            // Promise rejected
            erros.push({
              linha: batchStart + 2,
              titulo: 'Batch error',
              motivo: settled.reason?.message || 'Erro desconhecido no batch'
            });
          }
        }
        
        // Update progress after each batch
        const processedCount = Math.min(batchStart + BATCH_SIZE, rows.length);
        if (jobId) {
          await supabase
            .from('import_jobs')
            .update({
              processed_items: processedCount,
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
                  totalProcessed: processedCount
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
    
    // Start background processing using Deno's promise handling
    // Note: EdgeRuntime.waitUntil is not available, using Promise.resolve()
    Promise.resolve(backgroundTask()).catch(err => console.error("Background task error:", err));
    
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
