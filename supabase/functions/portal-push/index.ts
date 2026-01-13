import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// TYPES
// ============================================================

interface PortalJob {
  id: string;
  portal_id: string;
  imovel_id: string;
  action: 'publish' | 'update' | 'pause' | 'remove';
  status: string;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  last_error: string | null;
}

interface Portal {
  id: string;
  slug: string;
  nome: string;
  config: {
    api_credentials?: {
      client_id?: string;
      client_secret?: string;
      access_token?: string;
      refresh_token?: string;
      api_key?: string;
    };
    settings?: {
      default_category?: string;
      default_purpose?: string;
      auto_renew?: boolean;
    };
  };
}

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  type: string;
  status: string;
  profile: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garages: number;
  area: number;
  built_area: number | null;
  address_street: string | null;
  address_neighborhood: string | null;
  address_city: string;
  address_state: string;
  address_zipcode: string | null;
  address_lat: number | null;
  address_lng: number | null;
  features: string[] | null;
  amenities: string[] | null;
  condition: string | null;
  condo_fee: number | null;
  iptu: number | null;
  images?: { url: string; alt: string | null; order_index: number }[];
}

interface AdapterResult {
  success: boolean;
  external_id?: string;
  error?: string;
  response_data?: Record<string, unknown>;
}

interface PortalAdapter {
  testConnection: (credentials: Portal['config']['api_credentials']) => Promise<AdapterResult>;
  publish: (imovel: Property, credentials: Portal['config']['api_credentials'], settings?: Portal['config']['settings']) => Promise<AdapterResult>;
  update: (external_id: string, imovel: Property, credentials: Portal['config']['api_credentials'], settings?: Portal['config']['settings']) => Promise<AdapterResult>;
  pause: (external_id: string, credentials: Portal['config']['api_credentials']) => Promise<AdapterResult>;
  remove: (external_id: string, credentials: Portal['config']['api_credentials']) => Promise<AdapterResult>;
}

// ============================================================
// OLX ADAPTER - Real Implementation
// ============================================================
// Documentation: https://developers.olx.com.br/anuncio/api/home.html
// Rate Limit: 5000 requests/minute, blocked for 10 min on 429

const OLX_API_BASE = 'https://apps.olx.com.br';
const OLX_AUTH_BASE = 'https://auth.olx.com.br';

// OLX Category mappings
const OLX_CATEGORIES = {
  apartamento: 1020,
  casa: 1020, // Could be 1040, but default to apartamentos
  cobertura: 1020,
  flat: 1020,
  loft: 1020,
  terreno: 1100,
  comercial: 1120,
  galpao: 1120,
  rural: 1100,
} as const;

// OLX Apartment type mappings
const OLX_APARTMENT_TYPES = {
  padrao: '1',
  cobertura: '2',
  duplex: '3',
  kitnet: '4',
  loft: '5',
} as const;

// OLX House type mappings
const OLX_HOUSE_TYPES = {
  padrao: '1',
  vila: '2',
  condominio: '3',
} as const;

// OLX Commercial type mappings
const OLX_COMMERCIAL_TYPES = {
  escritorio: '1',
  galpao: '2',
  hotel: '3',
  fabrica: '4',
  garagem: '5',
  loja: '6',
  outros: '7',
} as const;

interface OlxCredentials {
  client_id?: string;
  client_secret?: string;
  access_token?: string;
  refresh_token?: string;
  phone?: string;
}

interface OlxImportResponse {
  token: string | null;
  statusCode: number;
  statusMessage: string;
  errors: Array<{
    id: string;
    status: string;
    messages: Array<{ category: string }>;
  }>;
}

interface OlxPublishingStatusResponse {
  statusCode: number;
  statusMessage: string;
  ad_list: Array<{
    id: string;
    status: string;
    list_id?: number;
    messages?: Array<{ category: string }>;
  }>;
}

// HTTP client with rate limit handling
async function olxFetch(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Handle rate limit (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitSeconds = retryAfter ? parseInt(retryAfter) : 60 * attempt; // Default: exponential backoff
        console.log(`[OLX] Rate limited. Waiting ${waitSeconds}s before retry ${attempt}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[OLX] Request failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error('OLX request failed after all retries');
}

// Map property to OLX category
function mapPropertyToCategory(prop: Property): number {
  const typeKey = prop.type?.toLowerCase() as keyof typeof OLX_CATEGORIES;
  return OLX_CATEGORIES[typeKey] || 1040; // Default: Casas
}

// Map property type to OLX subcategory type
function mapPropertySubtype(prop: Property, category: number): string {
  if (category === 1020) {
    // Apartments
    const typeMap: Record<string, string> = {
      'cobertura': '2',
      'flat': '4',
      'loft': '5',
    };
    return typeMap[prop.type?.toLowerCase()] || '1'; // Default: Padrão
  }
  if (category === 1040) {
    // Houses
    return '1'; // Default: Padrão
  }
  if (category === 1120) {
    // Commercial
    const typeMap: Record<string, string> = {
      'galpao': '2',
      'comercial': '6',
    };
    return typeMap[prop.type?.toLowerCase()] || '7'; // Default: Outros
  }
  return '1';
}

// Map property features to OLX feature codes
function mapPropertyFeatures(features: string[] | null): string[] {
  if (!features) return [];
  
  const featureMap: Record<string, string> = {
    'ar condicionado': '1',
    'ar-condicionado': '1',
    'academia': '2',
    'armarios': '3',
    'varanda': '4',
    'area de servico': '5',
    'churrasqueira': '6',
    'quarto de servico': '7',
    'piscina': '8',
    'armarios cozinha': '11',
    'mobiliado': '12',
  };
  
  const mapped: string[] = [];
  for (const feature of features) {
    const key = feature.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [pattern, code] of Object.entries(featureMap)) {
      if (key.includes(pattern)) {
        if (!mapped.includes(code)) mapped.push(code);
        break;
      }
    }
  }
  return mapped;
}

// Map amenities to OLX complex features
function mapComplexFeatures(amenities: string[] | null): string[] {
  if (!amenities) return [];
  
  const amenityMap: Record<string, string> = {
    'condominio fechado': '1',
    'elevador': '2',
    'seguranca 24h': '3',
    'portaria': '4',
    'pet friendly': '5',
    'animais': '5',
    'academia': '6',
    'piscina': '7',
    'salao de festas': '8',
  };
  
  const mapped: string[] = [];
  for (const amenity of amenities) {
    const key = amenity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [pattern, code] of Object.entries(amenityMap)) {
      if (key.includes(pattern)) {
        if (!mapped.includes(code)) mapped.push(code);
        break;
      }
    }
  }
  return mapped;
}

// Limit number to OLX max values
function limitNumber(value: number, max: number): string {
  return Math.min(value, max).toString();
}

// Build OLX ad payload
function buildOlxAdPayload(
  prop: Property,
  credentials: OlxCredentials,
  operation: 'insert' | 'delete' = 'insert'
): Record<string, unknown> {
  const category = mapPropertyToCategory(prop);
  
  // For delete, only need id and operation
  if (operation === 'delete') {
    return {
      id: prop.id.substring(0, 19), // OLX max 19 chars
      operation: 'delete',
    };
  }
  
  // Build params based on category
  const params: Record<string, unknown> = {
    rooms: limitNumber(prop.bedrooms, 5),
  };
  
  if (prop.bathrooms > 0) {
    params.bathrooms = limitNumber(prop.bathrooms, 5);
  }
  if (prop.garages >= 0) {
    params.garage_spaces = limitNumber(prop.garages, 5);
  }
  if (prop.area > 0) {
    params.size = prop.area.toString();
  }
  if (prop.iptu && prop.iptu > 0) {
    params.iptu = prop.iptu.toString();
  }
  if (prop.condo_fee && prop.condo_fee > 0) {
    params.condominio = prop.condo_fee.toString();
  }
  
  // Category-specific params
  if (category === 1020) {
    // Apartment
    params.apartment_type = mapPropertySubtype(prop, category);
    const features = mapPropertyFeatures(prop.features);
    if (features.length > 0) params.apartment_features = features;
    const complexFeatures = mapComplexFeatures(prop.amenities);
    if (complexFeatures.length > 0) params.apartment_complex_features = complexFeatures;
  } else if (category === 1040) {
    // House
    params.home_type = mapPropertySubtype(prop, category);
    const features = mapPropertyFeatures(prop.features);
    if (features.length > 0) params.home_features = features;
  } else if (category === 1120) {
    // Commercial
    params.commercial_type = mapPropertySubtype(prop, category);
    const features = mapPropertyFeatures(prop.amenities);
    if (features.length > 0) params.commercial_features = features;
  }
  
  // Get images (max 20)
  const images = (prop.images || [])
    .slice(0, 20)
    .map(img => img.url);
  
  if (images.length === 0) {
    throw new Error('OLX requires at least 1 image');
  }
  
  return {
    id: prop.id.substring(0, 19), // OLX allows max 19 chars
    operation: 'insert',
    category,
    subject: prop.title.substring(0, 90), // Max 90 chars
    body: (prop.description || prop.title).substring(0, 6000), // Max 6000 chars
    phone: parseInt((credentials.phone || '11999999999').replace(/\D/g, '')),
    type: prop.status === 'aluguel' ? 'u' : 's', // u = rental, s = sale
    price: Math.floor(prop.price), // No decimals
    zipcode: (prop.address_zipcode || '').replace(/\D/g, ''),
    params,
    images,
  };
}

const olxAdapter: PortalAdapter = {
  async testConnection(credentials) {
    console.log('[OLX] Testing connection...');
    
    const creds = credentials as OlxCredentials | undefined;
    
    if (!creds?.access_token) {
      return { 
        success: false, 
        error: 'Missing OLX access_token. Configure OAuth credentials first.' 
      };
    }

    try {
      // Test by fetching published ads list (empty is fine, just need success)
      const response = await olxFetch(
        `${OLX_API_BASE}/autoupload/published_ads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: creds.access_token,
            fetch_size: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[OLX] Connection test failed:', response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          return { 
            success: false, 
            error: 'Token inválido ou expirado. Necessário renovar autorização OAuth.',
            response_data: { status: response.status }
          };
        }
        
        return { 
          success: false, 
          error: `OLX API error: ${response.status}`,
          response_data: { status: response.status, body: errorText.substring(0, 200) }
        };
      }

      const data = await response.json();
      console.log('[OLX] Connection test successful');
      
      return { 
        success: true, 
        response_data: { 
          message: 'Conexão com OLX estabelecida com sucesso',
          ads_count: data.ads?.length || 0,
        } 
      };
    } catch (error) {
      console.error('[OLX] Connection test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  },

  async publish(imovel, credentials, settings) {
    console.log(`[OLX] Publishing property: ${imovel.id}`);
    
    const creds = credentials as OlxCredentials | undefined;
    
    if (!creds?.access_token) {
      return { success: false, error: 'Missing OLX access_token' };
    }

    try {
      // Validate required fields
      if (!imovel.address_zipcode) {
        return { success: false, error: 'CEP é obrigatório para OLX' };
      }
      if (!imovel.images || imovel.images.length === 0) {
        return { success: false, error: 'Pelo menos 1 imagem é obrigatória para OLX' };
      }

      // Get phone from settings or credentials
      const phone = settings?.default_phone || creds.phone;
      if (phone) {
        (creds as OlxCredentials).phone = phone as string;
      }

      const adPayload = buildOlxAdPayload(imovel, creds, 'insert');
      
      const requestBody = {
        access_token: creds.access_token,
        ad_list: [adPayload],
      };

      console.log('[OLX] Publishing ad with category:', adPayload.category);

      const response = await olxFetch(
        `${OLX_API_BASE}/autoupload/import`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: OlxImportResponse = await response.json();
      console.log('[OLX] Import response:', { statusCode: data.statusCode, statusMessage: data.statusMessage });

      if (data.statusCode === 0 && data.token) {
        // Success - ads queued for processing
        return {
          success: true,
          external_id: data.token, // We'll use import token, then fetch list_id later
          response_data: {
            import_token: data.token,
            message: data.statusMessage,
            ad_id: adPayload.id,
          }
        };
      } else {
        // Error
        const errorDetails = data.errors?.[0]?.messages?.map(m => m.category).join(', ') || data.statusMessage;
        return {
          success: false,
          error: `OLX Error ${data.statusCode}: ${errorDetails}`,
          response_data: {
            statusCode: data.statusCode,
            errors: data.errors,
          }
        };
      }
    } catch (error) {
      console.error('[OLX] Publish error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Publish failed' 
      };
    }
  },

  async update(external_id, imovel, credentials, settings) {
    console.log(`[OLX] Updating property: ${external_id}`);
    
    // OLX uses the same endpoint for insert and update
    // If the ID already exists, it's treated as an update
    return this.publish(imovel, credentials, settings);
  },

  async pause(external_id, credentials) {
    console.log(`[OLX] Pausing ad: ${external_id}`);
    
    // OLX doesn't have a pause endpoint
    // To "pause", we need to delete
    // But we can implement this as a no-op or actual delete
    return {
      success: false,
      error: 'OLX não suporta pausar anúncios. Use "remover" para despublicar.',
      external_id,
    };
  },

  async remove(external_id, credentials) {
    console.log(`[OLX] Removing ad: ${external_id}`);
    
    const creds = credentials as OlxCredentials | undefined;
    
    if (!creds?.access_token) {
      return { success: false, error: 'Missing OLX access_token' };
    }

    try {
      // OLX uses the same import endpoint with operation: delete
      const requestBody = {
        access_token: creds.access_token,
        ad_list: [{
          id: external_id.substring(0, 19),
          operation: 'delete',
        }],
      };

      const response = await olxFetch(
        `${OLX_API_BASE}/autoupload/import`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: OlxImportResponse = await response.json();
      
      if (data.statusCode === 0) {
        return {
          success: true,
          external_id,
          response_data: {
            message: 'Anúncio removido com sucesso',
            token: data.token,
          }
        };
      } else {
        return {
          success: false,
          error: `OLX Error ${data.statusCode}: ${data.statusMessage}`,
          response_data: { statusCode: data.statusCode, errors: data.errors }
        };
      }
    } catch (error) {
      console.error('[OLX] Remove error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Remove failed' 
      };
    }
  }
};

// ============================================================
// ADAPTER REGISTRY
// ============================================================

const adapters: Record<string, PortalAdapter> = {
  olx: olxAdapter,
  // Future adapters: vivareal, zap, imovelweb, etc.
};

function getAdapter(portalSlug: string): PortalAdapter | null {
  return adapters[portalSlug] || null;
}

// ============================================================
// JOB PROCESSOR
// ============================================================

async function processJobs(supabase: ReturnType<typeof createClient>, batchSize = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const result = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };

  // 1. Fetch queued jobs ready to run
  const { data: jobs, error: fetchError } = await supabase
    .from('portal_jobs')
    .select('*')
    .eq('status', 'queued')
    .lte('next_run_at', new Date().toISOString())
    .order('next_run_at', { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    console.error('Error fetching jobs:', fetchError);
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No jobs to process');
    return result;
  }

  console.log(`Processing ${jobs.length} jobs...`);

  for (const job of jobs as PortalJob[]) {
    const jobStartTime = Date.now();
    
    try {
      // 2. Lock job (optimistic - mark as processing)
      const { error: lockError } = await supabase
        .from('portal_jobs')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', job.id)
        .eq('status', 'queued'); // Ensure it's still queued

      if (lockError) {
        console.warn(`Failed to lock job ${job.id}:`, lockError);
        continue;
      }

      // 3. Fetch portal config
      const { data: portal, error: portalError } = await supabase
        .from('portais')
        .select('*')
        .eq('id', job.portal_id)
        .single();

      if (portalError || !portal) {
        throw new Error(`Portal not found: ${job.portal_id}`);
      }

      // 4. Get adapter
      const adapter = getAdapter(portal.slug);
      if (!adapter) {
        throw new Error(`No adapter for portal: ${portal.slug}`);
      }

      const credentials = portal.config?.api_credentials;
      const settings = portal.config?.settings;

      // 5. Fetch property data if needed
      let property: Property | null = null;
      if (job.action === 'publish' || job.action === 'update') {
        const { data: prop, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', job.imovel_id)
          .single();

        if (propError || !prop) {
          throw new Error(`Property not found: ${job.imovel_id}`);
        }

        // Fetch images
        const { data: images } = await supabase
          .from('property_images')
          .select('url, alt, order_index')
          .eq('property_id', job.imovel_id)
          .order('order_index', { ascending: true });

        property = { ...prop, images: images || [] } as Property;
      }

      // 6. Get existing publication for external_id
      const { data: publication } = await supabase
        .from('portal_publicacoes')
        .select('external_id')
        .eq('portal_id', job.portal_id)
        .eq('imovel_id', job.imovel_id)
        .single();

      const existingExternalId = publication?.external_id;

      // 7. Execute action
      let adapterResult: AdapterResult;

      switch (job.action) {
        case 'publish':
          if (!property) throw new Error('Property required for publish');
          adapterResult = await adapter.publish(property, credentials, settings);
          break;

        case 'update':
          if (!property) throw new Error('Property required for update');
          if (!existingExternalId) {
            // No external_id yet, publish instead
            adapterResult = await adapter.publish(property, credentials, settings);
          } else {
            adapterResult = await adapter.update(existingExternalId, property, credentials, settings);
          }
          break;

        case 'pause':
          if (!existingExternalId) throw new Error('No external_id to pause');
          adapterResult = await adapter.pause(existingExternalId, credentials);
          break;

        case 'remove':
          if (!existingExternalId) throw new Error('No external_id to remove');
          adapterResult = await adapter.remove(existingExternalId, credentials);
          break;

        default:
          throw new Error(`Unknown action: ${job.action}`);
      }

      const jobDuration = Date.now() - jobStartTime;

      if (adapterResult.success) {
        // 8a. Success - update job and publication
        await supabase
          .from('portal_jobs')
          .update({
            status: 'done',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Update publication status
        const publicationUpdate: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          ultima_tentativa: new Date().toISOString(),
          mensagem_erro: null
        };

        if (job.action === 'publish' || job.action === 'update') {
          publicationUpdate.status = 'published';
          if (adapterResult.external_id) {
            publicationUpdate.external_id = adapterResult.external_id;
          }
          if (property) {
            publicationUpdate.payload_snapshot = {
              title: property.title,
              price: property.price,
              synced_at: new Date().toISOString()
            };
          }
        } else if (job.action === 'pause' || job.action === 'remove') {
          publicationUpdate.status = 'disabled';
        }

        await supabase
          .from('portal_publicacoes')
          .update(publicationUpdate)
          .eq('portal_id', job.portal_id)
          .eq('imovel_id', job.imovel_id);

        // Log success
        await supabase.from('portal_logs').insert({
          portal_id: job.portal_id,
          status: 'success',
          total_itens: 1,
          tempo_geracao_ms: jobDuration,
          detalhes: {
            job_id: job.id,
            action: job.action,
            imovel_id: job.imovel_id,
            external_id: adapterResult.external_id,
            response_summary: adapterResult.response_data
          }
        });

        result.succeeded++;
        console.log(`✅ Job ${job.id} completed successfully in ${jobDuration}ms`);

      } else {
        // 8b. Failure - handle retry or mark as error
        throw new Error(adapterResult.error || 'Unknown adapter error');
      }

    } catch (error) {
      const jobDuration = Date.now() - jobStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Job ${job.id} failed:`, errorMessage);
      result.errors.push(`Job ${job.id}: ${errorMessage}`);

      const newAttempts = job.attempts + 1;

      if (newAttempts >= job.max_attempts) {
        // Max attempts reached - mark as error
        await supabase
          .from('portal_jobs')
          .update({
            status: 'error',
            attempts: newAttempts,
            last_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Update publication with error
        await supabase
          .from('portal_publicacoes')
          .update({
            status: 'error',
            mensagem_erro: errorMessage,
            ultima_tentativa: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('portal_id', job.portal_id)
          .eq('imovel_id', job.imovel_id);

      } else {
        // Retry with exponential backoff: 2^attempts minutes
        const backoffMinutes = Math.pow(2, newAttempts);
        const nextRun = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await supabase
          .from('portal_jobs')
          .update({
            status: 'queued',
            attempts: newAttempts,
            next_run_at: nextRun.toISOString(),
            last_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`🔄 Job ${job.id} will retry in ${backoffMinutes} minutes (attempt ${newAttempts}/${job.max_attempts})`);
      }

      // Log error
      await supabase.from('portal_logs').insert({
        portal_id: job.portal_id,
        status: 'error',
        total_itens: 1,
        tempo_geracao_ms: jobDuration,
        detalhes: {
          job_id: job.id,
          action: job.action,
          imovel_id: job.imovel_id,
          error: errorMessage,
          attempts: newAttempts,
          max_attempts: job.max_attempts
        }
      });

      result.failed++;
    }

    result.processed++;
  }

  const totalDuration = Date.now() - startTime;
  console.log(`Batch completed in ${totalDuration}ms: ${result.succeeded} succeeded, ${result.failed} failed`);

  return result;
}

// ============================================================
// HTTP HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const path = url.pathname.replace('/portal-push', '').replace(/^\//, '');

  try {
    // GET /portal-push/health
    if (req.method === 'GET' && (path === 'health' || path === '')) {
      const { count: pendingJobs } = await supabase
        .from('portal_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued');

      const { count: processingJobs } = await supabase
        .from('portal_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'processing');

      const { count: errorJobs } = await supabase
        .from('portal_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error');

      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queues: {
          pending: pendingJobs || 0,
          processing: processingJobs || 0,
          error: errorJobs || 0
        },
        adapters: Object.keys(adapters)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /portal-push/run
    if (req.method === 'POST' && path === 'run') {
      const body = await req.json().catch(() => ({}));
      const batchSize = body.batch_size || 10;

      console.log(`Manual trigger: processing up to ${batchSize} jobs...`);
      const result = await processJobs(supabase, batchSize);

      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        ...result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /portal-push/test-adapter
    if (req.method === 'POST' && path === 'test-adapter') {
      const { portal_slug, credentials } = await req.json();

      const adapter = getAdapter(portal_slug);
      if (!adapter) {
        return new Response(JSON.stringify({
          success: false,
          error: `No adapter for portal: ${portal_slug}`,
          available_adapters: Object.keys(adapters)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await adapter.testConnection(credentials);

      return new Response(JSON.stringify({
        portal: portal_slug,
        ...result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({
      error: 'Not Found',
      available_endpoints: [
        'GET /portal-push/health',
        'POST /portal-push/run',
        'POST /portal-push/test-adapter'
      ]
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Portal-push error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
