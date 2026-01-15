import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Property type labels for titles
const propertyTypeLabels: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Imóvel Comercial",
  rural: "Imóvel Rural",
  cobertura: "Cobertura",
  flat: "Flat",
  galpao: "Galpão",
  loft: "Loft",
};

// Format price in Brazilian currency
function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Escape HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    
    // Extract property ID or slug from path: /share-property/:idOrSlug
    const idOrSlug = pathParts[pathParts.length - 1];
    
    if (!idOrSlug || idOrSlug === "share-property") {
      return new Response("Property ID or slug required", { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    console.log(`[share-property] Fetching property: ${idOrSlug}`);

    // Initialize Supabase client with service role to update shares counter
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Try to find property by ID first, then by slug
    let property = null;
    let propertyImage = null;

    // Check if it looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", idOrSlug)
        .eq("active", true)
        .single();
      
      if (!error) property = data;
    }
    
    // If not found by ID, try slug
    if (!property) {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("slug", idOrSlug)
        .eq("active", true)
        .single();
      
      if (!error) property = data;
    }

    if (!property) {
      console.log(`[share-property] Property not found: ${idOrSlug}`);
      return new Response("Property not found", { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    console.log(`[share-property] Found property: ${property.id} - ${property.title}`);

    // Increment shares counter (fire and forget)
    supabaseAdmin
      .from("properties")
      .update({ shares: (property.shares || 0) + 1 })
      .eq("id", property.id)
      .then(({ error }) => {
        if (error) {
          console.error(`[share-property] Failed to increment shares:`, error);
        } else {
          console.log(`[share-property] Shares incremented for property: ${property.id}`);
        }
      });

    // Fetch property cover image
    const { data: images } = await supabase
      .from("property_images")
      .select("url, alt")
      .eq("property_id", property.id)
      .order("order_index", { ascending: true })
      .limit(1);

    propertyImage = images?.[0]?.url || null;

    // Fetch site config for defaults
    const { data: siteConfig } = await supabase
      .from("site_config")
      .select("*")
      .limit(1)
      .single();

    // Build URLs
    const baseUrl = url.origin.replace("/functions/v1", "");
    // Determine the frontend URL - use referer or construct from project
    const frontendUrl = req.headers.get("referer")?.split("/share")[0] || 
                        `https://lwxrneoeoqzlekusqgml.lovableproject.com`;
    const propertyUrl = `${frontendUrl}/imovel/${property.slug}`;
    const shareUrl = `${supabaseUrl}/functions/v1/share-property/${property.slug}`;

    // Build Open Graph content
    const typeLabel = propertyTypeLabels[property.type] || "Imóvel";
    const location = property.address_neighborhood 
      ? `${property.address_neighborhood}, ${property.address_city}`
      : property.address_city;
    
    const ogTitle = `${typeLabel} em ${location} – ${formatPrice(property.price)}`;
    const ogDescription = [
      property.bedrooms > 0 ? `${property.bedrooms} quarto${property.bedrooms > 1 ? "s" : ""}` : null,
      property.bathrooms > 0 ? `${property.bathrooms} banheiro${property.bathrooms > 1 ? "s" : ""}` : null,
      property.garages > 0 ? `${property.garages} vaga${property.garages > 1 ? "s" : ""}` : null,
      property.area > 0 ? `${property.area}m²` : null,
    ].filter(Boolean).join(", ") + ". Clique para ver fotos e detalhes.";

    // Use property image or fallback to site OG image or a default
    const ogImage = propertyImage || siteConfig?.og_image_url || `${frontendUrl}/placeholder.svg`;
    const siteName = siteConfig?.seo_title || "Imobiliária";

    // Generate HTML with Open Graph meta tags
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(ogTitle)}</title>
  <meta name="title" content="${escapeHtml(ogTitle)}">
  <meta name="description" content="${escapeHtml(ogDescription)}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:url" content="${escapeHtml(propertyUrl)}">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(property.title)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(propertyUrl)}">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  
  <!-- Redirect after 2 seconds -->
  <meta http-equiv="refresh" content="2;url=${escapeHtml(propertyUrl)}">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      font-size: 20px;
      color: #333;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    p {
      color: #666;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>${escapeHtml(ogTitle)}</h1>
    <p>Redirecionando para o imóvel...</p>
    <a href="${escapeHtml(propertyUrl)}" class="btn">Abrir Imóvel</a>
    <div class="footer">
      ${escapeHtml(siteName)}
    </div>
  </div>
</body>
</html>`;

    console.log(`[share-property] Returning HTML for property: ${property.slug}`);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error: unknown) {
    console.error("[share-property] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error: ${errorMessage}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
