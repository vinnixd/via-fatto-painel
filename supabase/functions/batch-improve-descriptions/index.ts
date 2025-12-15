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

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get properties without descriptions
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, type, status, bedrooms, suites, bathrooms, garages, area, address_neighborhood, address_city, description')
      .or('description.is.null,description.eq.');

    if (fetchError) throw fetchError;

    console.log(`Found ${properties?.length || 0} properties to update`);

    const systemPrompt = `Você é um especialista em marketing imobiliário e SEO. Sua tarefa é criar descrições de imóveis para maximizar conversão e otimização para mecanismos de busca.

Diretrizes:
1. Use linguagem persuasiva e profissional
2. Destaque os principais benefícios e diferenciais
3. Inclua palavras-chave relevantes para SEO
4. Organize em parágrafos claros e concisos
5. Crie senso de urgência e exclusividade
6. Mantenha o texto em português brasileiro
7. Limite a aproximadamente 150-200 palavras
8. Inclua chamadas para ação sutis

Formato: Retorne APENAS o texto da descrição, sem títulos ou formatação extra.`;

    const results = { updated: 0, errors: [] as string[] };

    for (const property of properties || []) {
      try {
        const userPrompt = `Crie uma descrição otimizada para este imóvel:

Título: ${property.title}
Tipo: ${property.type}
Status: ${property.status === 'venda' ? 'À venda' : 'Para alugar'}
Quartos: ${property.bedrooms || 0}
Suítes: ${property.suites || 0}
Banheiros: ${property.bathrooms || 0}
Vagas: ${property.garages || 0}
Área: ${property.area || 0}m²
Bairro: ${property.address_neighborhood || 'Não informado'}
Cidade: ${property.address_city || 'Não informado'}`;

        console.log(`Processing: ${property.title}`);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI error for ${property.title}:`, errorText);
          results.errors.push(`${property.title}: AI error`);
          continue;
        }

        const data = await response.json();
        const newDescription = data.choices?.[0]?.message?.content;

        if (newDescription) {
          const { error: updateError } = await supabase
            .from('properties')
            .update({ description: newDescription.trim() })
            .eq('id', property.id);

          if (updateError) {
            results.errors.push(`${property.title}: Update failed`);
          } else {
            results.updated++;
            console.log(`Updated: ${property.title}`);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error processing ${property.title}:`, err);
        results.errors.push(`${property.title}: ${err.message}`);
      }
    }

    console.log("Batch update complete:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in batch-improve-descriptions:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro ao processar" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
