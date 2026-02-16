import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, propertyInfo } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em marketing imobiliário. Sua tarefa é melhorar títulos de anúncios de imóveis para maximizar cliques e conversão.

Diretrizes OBRIGATÓRIAS:
1. O título deve ser CURTO (máximo 60 caracteres)
2. Destaque os principais diferenciais do imóvel
3. Use palavras que chamam atenção: "Exclusivo", "Único", "Oportunidade", etc.
4. Inclua características marcantes (piscina, vista, área gourmet, etc.)
5. Mencione a localização se for um diferencial
6. Use letra maiúscula no início de cada palavra importante
7. Não use pontuação no final
8. Mantenha em português brasileiro

IMPORTANTE: Retorne APENAS o título melhorado, sem explicações adicionais.`;

    const userPrompt = `Melhore este título de anúncio imobiliário:

Título atual: "${title}"

Informações do imóvel:
- Tipo: ${propertyInfo?.type || 'Não informado'}
- Status: ${propertyInfo?.status === 'venda' ? 'À venda' : 'Para alugar'}
- Quartos: ${propertyInfo?.bedrooms || 0}
- Suítes: ${propertyInfo?.suites || 0}
- Vagas: ${propertyInfo?.garages || 0}
- Área: ${propertyInfo?.area || 0}m²
- Bairro: ${propertyInfo?.neighborhood || 'Não informado'}
- Cidade: ${propertyInfo?.city || 'Não informado'}
- Características: ${propertyInfo?.features?.join(', ') || 'Não informado'}

Gere um título mais atraente e persuasivo.`;

    console.log("Calling OpenAI API for title improvement...");

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
    let improvedTitle = data.choices?.[0]?.message?.content?.trim();

    if (!improvedTitle) {
      throw new Error("No response from AI");
    }

    // Clean up the title - remove quotes if present
    improvedTitle = improvedTitle.replace(/^["']|["']$/g, '').trim();
    
    // Strict 60 char limit — cut at last space, NO ellipsis
    if (improvedTitle.length > 60) {
      const cutAt = improvedTitle.lastIndexOf(' ', 60);
      improvedTitle = cutAt > 30
        ? improvedTitle.substring(0, cutAt).trim()
        : improvedTitle.substring(0, 60).trim();
    }

    console.log("Title improved successfully:", improvedTitle);

    return new Response(JSON.stringify({ improvedTitle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in improve-title function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao melhorar título";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
