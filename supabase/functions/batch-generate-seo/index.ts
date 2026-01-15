import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const propertyTypeLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Imóvel Comercial',
  rural: 'Imóvel Rural',
  cobertura: 'Cobertura',
  flat: 'Flat',
  galpao: 'Galpão',
};

const statusLabels: Record<string, string> = {
  venda: 'à Venda',
  aluguel: 'para Alugar',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch properties without SEO
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, type, status, address_city, address_state, address_neighborhood, bedrooms, bathrooms, garages, area, price, features')
      .or('seo_title.is.null,seo_description.is.null,seo_title.eq.,seo_description.eq.')
      .eq('active', true)
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Todos os imóveis já possuem SEO configurado",
        processed: 0,
        total: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${properties.length} properties for SEO generation`);

    let processed = 0;
    let errors = 0;

    for (const property of properties) {
      try {
        const type = propertyTypeLabels[property.type] || property.type || 'Imóvel';
        const status = statusLabels[property.status] || property.status || '';
        const featuresList = (property.features || []).slice(0, 3).join(', ');

        const systemPrompt = `Você é um especialista em SEO para sites imobiliários no Brasil. 
Sua tarefa é gerar title tags e meta descriptions otimizados para Google.

REGRAS IMPORTANTES:
1. Title SEO: máximo 60 caracteres, incluir palavra-chave principal no início
2. Meta Description: máximo 155 caracteres, incluir CTA (chamada para ação)
3. Usar linguagem persuasiva e profissional em português brasileiro
4. Incluir localização (cidade, bairro) quando disponível
5. Incluir características principais (quartos, área) quando relevantes
6. Evitar caracteres especiais desnecessários
7. Criar urgência e exclusividade

FORMATO DE SAÍDA (JSON):
{
  "seo_title": "título otimizado aqui",
  "seo_description": "descrição meta otimizada aqui"
}`;

        const userPrompt = `Gere SEO title e meta description para este imóvel:

Tipo: ${type}
Status: ${status}
Título atual: ${property.title}
Cidade: ${property.address_city}
Estado: ${property.address_state}
Bairro: ${property.address_neighborhood || ''}
Quartos: ${property.bedrooms || 0}
Banheiros: ${property.bathrooms || 0}
Vagas: ${property.garages || 0}
Área: ${property.area || 0}m²
Preço: ${property.price > 0 ? `R$ ${property.price.toLocaleString('pt-BR')}` : 'Sob consulta'}
Características: ${featuresList}

Retorne APENAS o JSON com seo_title e seo_description.`;

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
          console.error(`AI error for property ${property.id}:`, response.status);
          errors++;
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          errors++;
          continue;
        }

        let seoData;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            seoData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found");
          }
        } catch {
          // Fallback
          const basicTitle = `${type} ${status} em ${property.address_city}`.substring(0, 60);
          const basicDesc = `${type} ${status} ${property.address_neighborhood ? `no ${property.address_neighborhood}, ` : ''}${property.address_city}. Agende visita!`.substring(0, 155);
          seoData = { seo_title: basicTitle, seo_description: basicDesc };
        }

        // Update property
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            seo_title: (seoData.seo_title || '').substring(0, 60),
            seo_description: (seoData.seo_description || '').substring(0, 155),
          })
          .eq('id', property.id);

        if (updateError) {
          console.error(`Update error for property ${property.id}:`, updateError);
          errors++;
        } else {
          processed++;
          console.log(`SEO generated for property ${property.id}`);
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`Error processing property ${property.id}:`, err);
        errors++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `SEO gerado para ${processed} imóveis`,
      processed,
      errors,
      total: properties.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in batch-generate-seo:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
