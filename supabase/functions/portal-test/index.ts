import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OLX API test connection
async function testOlxConnection(credentials: Record<string, unknown>): Promise<{
  ok: boolean;
  error?: string;
  accountInfo?: Record<string, unknown>;
}> {
  const accessToken = credentials?.access_token as string;
  
  if (!accessToken) {
    return { ok: false, error: 'Token de acesso não configurado' };
  }

  try {
    const response = await fetch('https://apps.olx.com.br/autoupload/published_ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        fetch_size: 1,
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, error: 'Token inválido ou expirado. Autorize novamente via OAuth.' };
      }
      return { ok: false, error: `Erro HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      ok: true,
      accountInfo: {
        ads_count: data.ads?.length || 0,
        connected_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Erro de conexão' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portalId } = await req.json();

    if (!portalId) {
      return new Response(
        JSON.stringify({ error: 'Missing portalId' }),
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
      .eq('id', portalId)
      .single();

    if (portalError || !portal) {
      return new Response(
        JSON.stringify({ error: 'Portal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = portal.config || {};
    const filtros = config.filtros || {};
    const warnings: string[] = [];
    
    // API connection test for API method portals
    let apiConnectionResult: { ok: boolean; error?: string; accountInfo?: Record<string, unknown> } | null = null;
    
    if (portal.metodo === 'api') {
      const credentials = config.api_credentials || {};
      
      // Test connection based on portal slug
      if (portal.slug === 'olx') {
        apiConnectionResult = await testOlxConnection(credentials);
      } else {
        // Generic check for access_token presence
        if (credentials.access_token) {
          apiConnectionResult = { ok: true, accountInfo: { message: 'Credenciais configuradas' } };
        } else {
          apiConnectionResult = { ok: false, error: 'Credenciais de API não configuradas' };
        }
      }
      
      if (!apiConnectionResult.ok) {
        warnings.push(`Conexão API: ${apiConnectionResult.error}`);
      }
    }

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        id, title, slug, description, price, status, active, featured,
        address_city, address_state, address_zipcode,
        property_images (id)
      `);

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

    const { data: properties, error: propertiesError } = await query.limit(100);

    if (propertiesError) {
      throw propertiesError;
    }

    let filteredProperties = properties || [];
    const initialCount = filteredProperties.length;

    // Check for issues
    const withoutPrice = filteredProperties.filter((p: any) => !p.price || p.price <= 0);
    const withoutImages = filteredProperties.filter((p: any) => !p.property_images || p.property_images.length === 0);
    const withoutDescription = filteredProperties.filter((p: any) => !p.description);
    const withoutAddress = filteredProperties.filter((p: any) => !p.address_city || !p.address_state);
    const withoutZipcode = filteredProperties.filter((p: any) => !p.address_zipcode);

    if (withoutPrice.length > 0) {
      warnings.push(`${withoutPrice.length} imóveis sem preço`);
    }
    if (withoutImages.length > 0) {
      warnings.push(`${withoutImages.length} imóveis sem fotos`);
    }
    if (withoutDescription.length > 0) {
      warnings.push(`${withoutDescription.length} imóveis sem descrição`);
    }
    if (withoutAddress.length > 0) {
      warnings.push(`${withoutAddress.length} imóveis sem endereço completo`);
    }
    // CEP is required for OLX
    if (portal.slug === 'olx' && withoutZipcode.length > 0) {
      warnings.push(`${withoutZipcode.length} imóveis sem CEP (obrigatório para OLX)`);
    }

    // Apply post-filters
    if (filtros.excluir_sem_fotos) {
      filteredProperties = filteredProperties.filter(
        (p: any) => p.property_images && p.property_images.length > 0
      );
    }

    if (filtros.excluir_sem_endereco) {
      filteredProperties = filteredProperties.filter(
        (p: any) => p.address_city && p.address_state
      );
    }

    const finalCount = filteredProperties.length;
    const excluded = initialCount - finalCount;

    if (excluded > 0) {
      warnings.push(`${excluded} imóveis excluídos pelos filtros`);
    }

    // Get preview of first 3 properties
    const preview = filteredProperties.slice(0, 3).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      images: p.property_images?.length || 0,
      hasDescription: !!p.description,
      hasZipcode: !!p.address_zipcode,
      location: `${p.address_city || '?'}, ${p.address_state || '?'}`,
    }));

    // Valid if no critical warnings (API connection is critical for API portals)
    const hasApiError = portal.metodo === 'api' && apiConnectionResult && !apiConnectionResult.ok;
    const valid = !hasApiError && (warnings.length === 0 || (warnings.length === 1 && excluded > 0));

    console.log(`Portal test for ${portal.slug}: ${finalCount} properties, ${warnings.length} warnings, API: ${apiConnectionResult?.ok ?? 'N/A'}`);

    return new Response(
      JSON.stringify({
        valid,
        totalItems: finalCount,
        warnings,
        preview,
        config: {
          formato: portal.formato_feed,
          metodo: portal.metodo,
          limite_fotos: config.limite_fotos,
          filtros,
        },
        apiConnection: apiConnectionResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Portal test error:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
