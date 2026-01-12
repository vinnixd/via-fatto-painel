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
// OLX ADAPTER
// ============================================================
// Stub implementation - fill with real OLX API calls

const olxAdapter: PortalAdapter = {
  async testConnection(credentials) {
    console.log('[OLX] Testing connection...');
    
    if (!credentials?.access_token && !credentials?.api_key) {
      return { success: false, error: 'Missing OLX credentials (access_token or api_key)' };
    }

    // TODO: Implement real OLX API health check
    // Example: GET https://api.olx.com.br/v1/autoupload/health
    // Headers: Authorization: Bearer {access_token}
    
    return { 
      success: true, 
      response_data: { message: 'Connection stub - implement real API call' } 
    };
  },

  async publish(imovel, credentials, settings) {
    console.log(`[OLX] Publishing property: ${imovel.id}`);
    
    if (!credentials?.access_token) {
      return { success: false, error: 'Missing OLX access_token' };
    }

    // TODO: Implement real OLX publish API
    // POST https://api.olx.com.br/v1/autoupload/publish
    // 
    // Payload structure:
    // {
    //   "category": settings?.default_category || mapPropertyType(imovel.type),
    //   "subject": imovel.title,
    //   "body": imovel.description,
    //   "price": imovel.price,
    //   "images": imovel.images?.map(img => img.url),
    //   "location": {
    //     "zipcode": imovel.address_zipcode,
    //     "neighborhood": imovel.address_neighborhood,
    //     "city": imovel.address_city,
    //     "state": imovel.address_state
    //   },
    //   "params": {
    //     "rooms": imovel.bedrooms,
    //     "bathrooms": imovel.bathrooms,
    //     "garage_spaces": imovel.garages,
    //     "size": imovel.area,
    //     "built_area": imovel.built_area
    //   }
    // }

    // Stub response - simulating success
    const stubExternalId = `olx_${Date.now()}_${imovel.id.substring(0, 8)}`;
    
    return {
      success: true,
      external_id: stubExternalId,
      response_data: {
        message: 'Publish stub - implement real API call',
        stub_id: stubExternalId,
        property_title: imovel.title
      }
    };
  },

  async update(external_id, imovel, credentials, settings) {
    console.log(`[OLX] Updating property: ${external_id}`);
    
    if (!credentials?.access_token) {
      return { success: false, error: 'Missing OLX access_token' };
    }

    // TODO: Implement real OLX update API
    // PUT https://api.olx.com.br/v1/autoupload/ad/{external_id}
    
    return {
      success: true,
      external_id,
      response_data: {
        message: 'Update stub - implement real API call',
        updated_id: external_id
      }
    };
  },

  async pause(external_id, credentials) {
    console.log(`[OLX] Pausing ad: ${external_id}`);
    
    if (!credentials?.access_token) {
      return { success: false, error: 'Missing OLX access_token' };
    }

    // TODO: Implement real OLX pause API
    // POST https://api.olx.com.br/v1/autoupload/ad/{external_id}/pause
    
    return {
      success: true,
      external_id,
      response_data: {
        message: 'Pause stub - implement real API call'
      }
    };
  },

  async remove(external_id, credentials) {
    console.log(`[OLX] Removing ad: ${external_id}`);
    
    if (!credentials?.access_token) {
      return { success: false, error: 'Missing OLX access_token' };
    }

    // TODO: Implement real OLX delete API
    // DELETE https://api.olx.com.br/v1/autoupload/ad/{external_id}
    
    return {
      success: true,
      external_id,
      response_data: {
        message: 'Remove stub - implement real API call'
      }
    };
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
