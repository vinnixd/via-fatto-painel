import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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
      console.error('Portal not found:', portalError);
      return new Response(
        JSON.stringify({ error: 'Portal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = portal.config || {};
    const filtros = config.filtros || {};

    // Build query - ALWAYS filter by integrar_portais = true
    let query = supabase
      .from('properties')
      .select('id, title, slug, price, status, active, featured, address_city, address_state, integrar_portais, property_images(id)')
      .eq('integrar_portais', true);

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

    const { data: properties, error: propertiesError } = await query;

    if (propertiesError) {
      throw propertiesError;
    }

    let filteredProperties = properties || [];

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

    const totalItems = filteredProperties.length;
    const elapsedTime = Date.now() - startTime;

    // Update or create publication records
    for (const prop of filteredProperties) {
      const { error: upsertError } = await supabase
        .from('portal_publicacoes')
        .upsert(
          {
            portal_id: portalId,
            imovel_id: prop.id,
            status: 'published',
            ultima_tentativa: new Date().toISOString(),
            payload_snapshot: {
              title: prop.title,
              slug: prop.slug,
              price: prop.price,
            },
          },
          { onConflict: 'portal_id,imovel_id' }
        );

      if (upsertError) {
        console.error('Upsert error for property:', prop.id, upsertError);
      }
    }

    // Create log entry
    const feedUrl = `${supabaseUrl}/functions/v1/portal-feed?portal=${portal.slug}&token=${portal.token_feed}`;

    const { error: logError } = await supabase
      .from('portal_logs')
      .insert({
        portal_id: portalId,
        status: 'success',
        total_itens: totalItems,
        tempo_geracao_ms: elapsedTime,
        feed_url: feedUrl,
        detalhes: {
          message: `Feed gerado com sucesso`,
          properties_count: totalItems,
          filters_applied: filtros,
        },
      });

    if (logError) {
      console.error('Log insert error:', logError);
    }

    console.log(`Portal sync completed for ${portal.slug}: ${totalItems} properties in ${elapsedTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        totalItems,
        elapsedTime,
        feedUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Portal sync error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
