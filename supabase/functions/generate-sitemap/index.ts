import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Property type labels for URL generation
const propertyTypeLabels: Record<string, string> = {
  casa: 'casas',
  apartamento: 'apartamentos',
  terreno: 'terrenos',
  comercial: 'imoveis-comerciais',
  rural: 'imoveis-rurais',
  cobertura: 'coberturas',
  flat: 'flats',
  galpao: 'galpoes',
};

function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL from request or env
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get('baseUrl') || `${url.protocol}//${url.host}`.replace('/functions/v1/generate-sitemap', '');

    // Fetch all active properties
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('slug, updated_at, address_city, address_state, address_neighborhood, type, status')
      .eq('active', true);

    if (propError) {
      console.error('Error fetching properties:', propError);
      throw propError;
    }

    // Get unique cities and neighborhoods
    const locations = new Map<string, { city: string; state: string; neighborhoods: Set<string> }>();
    
    properties?.forEach(p => {
      const key = `${p.address_city}-${p.address_state}`;
      if (!locations.has(key)) {
        locations.set(key, {
          city: p.address_city,
          state: p.address_state,
          neighborhoods: new Set()
        });
      }
      if (p.address_neighborhood) {
        locations.get(key)!.neighborhoods.add(p.address_neighborhood);
      }
    });

    // Generate sitemap XML
    const now = new Date().toISOString();
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/sobre</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contato</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Add property pages
    properties?.forEach(p => {
      sitemap += `  <url>
    <loc>${baseUrl}/imovel/${p.slug}</loc>
    <lastmod>${p.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Add location pages (cities)
    locations.forEach((loc, key) => {
      const citySlug = normalizeSlug(loc.city);
      sitemap += `  <url>
    <loc>${baseUrl}/imoveis/localizacao?city=${encodeURIComponent(loc.city)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
      
      // Add neighborhood pages
      loc.neighborhoods.forEach(neighborhood => {
        sitemap += `  <url>
    <loc>${baseUrl}/imoveis/localizacao?city=${encodeURIComponent(loc.city)}&amp;bairro=${encodeURIComponent(neighborhood)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      });

      // Add type-specific location pages
      Object.keys(propertyTypeLabels).forEach(type => {
        sitemap += `  <url>
    <loc>${baseUrl}/imoveis/localizacao?city=${encodeURIComponent(loc.city)}&amp;tipo=${type}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      });
    });

    sitemap += `</urlset>`;

    console.log(`Sitemap generated with ${properties?.length || 0} properties and ${locations.size} locations`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar sitemap";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
