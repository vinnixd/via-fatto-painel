import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

function extractJson(raw: string): Record<string, string> {
  // Remove code block markers
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Extract JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  // Fix trailing commas
  let jsonStr = match[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  return JSON.parse(jsonStr);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyInfo } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const type = propertyTypeLabels[propertyInfo?.type] || propertyInfo?.type || 'Imóvel';
    const status = statusLabels[propertyInfo?.status] || propertyInfo?.status || '';
    const city = propertyInfo?.city || '';
    const state = propertyInfo?.state || '';
    const neighborhood = propertyInfo?.neighborhood || '';
    const bedrooms = propertyInfo?.bedrooms || 0;
    const bathrooms = propertyInfo?.bathrooms || 0;
    const garages = propertyInfo?.garages || 0;
    const area = propertyInfo?.area || 0;
    const price = propertyInfo?.price || 0;
    const features = propertyInfo?.features || [];
    const title = propertyInfo?.title || '';

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

    const featuresList = features.length > 0 ? features.slice(0, 3).join(', ') : '';
    
    const userPrompt = `Gere SEO title e meta description para este imóvel:

Tipo: ${type}
Status: ${status}
Título atual: ${title}
Cidade: ${city}
Estado: ${state}
Bairro: ${neighborhood}
Quartos: ${bedrooms}
Banheiros: ${bathrooms}
Vagas: ${garages}
Área: ${area}m²
Preço: ${price > 0 ? `R$ ${price.toLocaleString('pt-BR')}` : 'Sob consulta'}
Características: ${featuresList}

Retorne APENAS o JSON com seo_title e seo_description.`;

    console.log("Generating SEO for property:", { type, city, neighborhood });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na conta OpenAI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    let seoData;
    try {
      seoData = extractJson(content);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, content);
      
      // Fallback: generate basic SEO
      const basicTitle = `${type} ${status} em ${city} ${state}`.substring(0, 60);
      const basicDesc = `${type} ${status} ${neighborhood ? `no ${neighborhood}, ` : ''}${city}. ${bedrooms > 0 ? `${bedrooms} quartos, ` : ''}${area > 0 ? `${area}m². ` : ''}Agende visita!`.substring(0, 155);
      
      seoData = {
        seo_title: basicTitle,
        seo_description: basicDesc
      };
    }

    // Ensure limits
    seoData.seo_title = (seoData.seo_title || '').substring(0, 60);
    seoData.seo_description = (seoData.seo_description || '').substring(0, 155);

    console.log("SEO generated successfully:", seoData);

    return new Response(JSON.stringify(seoData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-seo function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar SEO";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
