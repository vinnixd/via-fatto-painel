import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyImageMapping {
  slug: string;
  images: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mappings, tenantId } = await req.json() as { 
      mappings: PropertyImageMapping[];
      tenantId: string;
    };

    console.log(`Starting image import for ${mappings.length} properties`);

    // First, get all property IDs by slug
    const slugs = mappings.map(m => m.slug);
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, slug')
      .eq('tenant_id', tenantId)
      .in('slug', slugs);

    if (propError) {
      console.error('Error fetching properties:', propError);
      throw propError;
    }

    console.log(`Found ${properties?.length || 0} properties matching slugs`);

    const slugToId = new Map(properties?.map(p => [p.slug, p.id]) || []);

    let totalImages = 0;
    let insertedImages = 0;
    let skippedImages = 0;
    const errors: string[] = [];

    for (const mapping of mappings) {
      const propertyId = slugToId.get(mapping.slug);
      
      if (!propertyId) {
        console.log(`Property not found for slug: ${mapping.slug}`);
        continue;
      }

      // Check if this property already has images
      const { count } = await supabase
        .from('property_images')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      if (count && count > 0) {
        console.log(`Skipping ${mapping.slug} - already has ${count} images`);
        skippedImages += mapping.images.length;
        continue;
      }

      // Insert images for this property
      const imagesToInsert = mapping.images.map((url, index) => ({
        property_id: propertyId,
        url: url.trim(),
        order_index: index,
        alt: `${mapping.slug} - Imagem ${index + 1}`,
      }));

      totalImages += imagesToInsert.length;

      const { data: inserted, error: insertError } = await supabase
        .from('property_images')
        .insert(imagesToInsert)
        .select('id');

      if (insertError) {
        console.error(`Error inserting images for ${mapping.slug}:`, insertError);
        errors.push(`${mapping.slug}: ${insertError.message}`);
      } else {
        insertedImages += inserted?.length || 0;
        console.log(`Inserted ${inserted?.length} images for ${mapping.slug}`);
      }
    }

    console.log(`Import completed: ${insertedImages}/${totalImages} images inserted, ${skippedImages} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        totalImages,
        insertedImages,
        skippedImages,
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
