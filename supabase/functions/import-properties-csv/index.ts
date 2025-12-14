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

function parseNumber(value: string): number | null {
  if (!value) return null;
  const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Parse price from various formats:
 * - R$ 1.350.000,00
 * - 1.350.000,00
 * - 1350000
 * - 1350000.00
 * - 1350000,00
 */
function parsePrice(value: string): number | null {
  if (!value || !value.trim()) return null;
  
  // Remove R$, spaces and currency symbols
  let cleaned = value.replace(/R\$|\s/g, '').trim();
  
  if (!cleaned) return null;
  
  // Check if it's Brazilian format (1.350.000,00) or standard (1350000.00)
  const hasBrazilianFormat = cleaned.includes('.') && cleaned.includes(',');
  const hasOnlyComma = !cleaned.includes('.') && cleaned.includes(',');
  const hasOnlyDot = cleaned.includes('.') && !cleaned.includes(',');
  
  if (hasBrazilianFormat) {
    // Brazilian format: remove dots (thousands separator), replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasOnlyComma) {
    // Comma as decimal separator: 1350000,00
    cleaned = cleaned.replace(',', '.');
  } else if (hasOnlyDot) {
    // Could be thousands separator (1.350.000) or decimal (1350000.00)
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots = thousands separators
      cleaned = cleaned.replace(/\./g, '');
    }
    // Single dot with 2 decimals stays as is (1350000.00)
  }
  
  // Remove any remaining non-numeric characters except decimal point
  cleaned = cleaned.replace(/[^\d.]/g, '');
  
  const num = parseFloat(cleaned);
  return isNaN(num) || num < 0 ? null : num;
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
): Promise<{ success: boolean; created: boolean; updated: boolean; imagesCount: number; error?: string }> {
  try {
    const title = row['Title'] || row['title'] || '';
    if (!title) {
      return { success: false, created: false, updated: false, imagesCount: 0, error: 'Título vazio' };
    }
    
    const permalink = row['Permalink'] || row['permalink'] || '';
    const slug = row['Slug'] || row['slug'] || generateSlug(title);
    const description = row['Content'] || row['content'] || row['Excerpt'] || row['excerpt'] || '';
    
    const estadoCidade = row['Estado e Cidade'] || row['estado_cidade'] || '';
    const { estado, cidade } = parseLocation(estadoCidade);
    
    const tipo = row['Tipo do Imóvel'] || row['tipo'] || 'Casa';
    const finalidade = row['Finalidade'] || row['finalidade'] || 'Venda';
    const destaque = (row['Destaque'] || '').toLowerCase() === 'destaque';
    
    const precoRaw = row['Preço'] || row['preco'] || row['Price'] || row['price'] || '';
    const preco = parsePrice(precoRaw);
    const quartos = parseIntValue(row['Quartos'] || row['quartos'] || row['Bedrooms'] || '');
    const banheiros = parseIntValue(row['Banheiros'] || row['banheiros'] || row['Bathrooms'] || '');
    const vagas = parseIntValue(row['Vagas'] || row['vagas'] || row['Garages'] || row['Garagem'] || '');
    const area = parseNumber(row['Área'] || row['area'] || row['Area'] || '');
    
    // Build property data - only include price if it was parsed successfully
    const propertyData: Record<string, unknown> = {
      title,
      slug,
      description,
      address_state: estado,
      address_city: cidade,
      type: mapPropertyType(tipo),
      status: mapPropertyStatus(finalidade),
      featured: destaque,
      old_url: permalink,
      bedrooms: quartos,
      bathrooms: banheiros,
      garages: vagas,
      area: area || 0,
      updated_at: new Date().toISOString()
    };
    
    // Only set price if parsed successfully (don't overwrite existing with 0)
    if (preco !== null) {
      propertyData.price = preco;
    }
    
    console.log(`Processing: ${title} (${slug}) - Price: ${preco !== null ? preco : 'not set'}`);
    
    // Check if property exists
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
      
      // Delete existing images
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
    
    // Process images
    const imageUrlsRaw = row['Image URL'] || row['image_url'] || row['Attachment URL'] || '';
    const imageUrls = imageUrlsRaw
      .split('|')
      .map(url => url.trim())
      .filter(url => url.startsWith('http'));
    
    console.log(`Found ${imageUrls.length} images for ${title}`);
    
    let imagesCount = 0;
    for (let imgIndex = 0; imgIndex < imageUrls.length; imgIndex++) {
      const uploadedUrl = await downloadAndUploadImage(supabase, imageUrls[imgIndex], slug, imgIndex);
      
      if (uploadedUrl) {
        const { error: imgError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            url: uploadedUrl,
            order_index: imgIndex,
            alt: `${title} - Imagem ${imgIndex + 1}`
          });
        
        if (!imgError) imagesCount++;
      }
    }
    
    return { success: true, created, updated, imagesCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error line ${lineNumber}: ${errorMessage}`);
    return { success: false, created: false, updated: false, imagesCount: 0, error: errorMessage };
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
    
    // Process in background using waitUntil
    const backgroundTask = async () => {
      let criados = 0;
      let atualizados = 0;
      let imagensImportadas = 0;
      const erros: Array<{ linha: number; titulo: string; motivo: string }> = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNumber = i + 2;
        
        const result = await processProperty(supabase, row, lineNumber);
        
        if (result.success) {
          if (result.created) criados++;
          if (result.updated) atualizados++;
          imagensImportadas += result.imagesCount;
        } else {
          erros.push({
            linha: lineNumber,
            titulo: row['Title'] || row['title'] || 'Desconhecido',
            motivo: result.error || 'Erro desconhecido'
          });
        }
      }
      
      console.log(`Import completed: ${criados} created, ${atualizados} updated, ${imagensImportadas} images, ${erros.length} errors`);
    };
    
    // Start background processing
    EdgeRuntime.waitUntil(backgroundTask());
    
    // Return immediate response
    return new Response(
      JSON.stringify({
        message: 'Importação iniciada em segundo plano',
        total_linhas: rows.length,
        status: 'processing',
        info: 'A importação está sendo processada. Verifique a lista de imóveis em alguns minutos.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
