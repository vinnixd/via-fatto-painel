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
    const { description, propertyInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em marketing imobiliário e SEO. Sua tarefa é melhorar descrições de imóveis para maximizar conversão e otimização para mecanismos de busca.

Diretrizes:
1. Use linguagem persuasiva e profissional
2. Destaque os principais benefícios e diferenciais
3. Inclua palavras-chave relevantes para SEO (imóvel, casa, apartamento, venda, aluguel, localização)
4. Organize em parágrafos claros e concisos
5. Crie senso de urgência e exclusividade
6. Mantenha o texto em português brasileiro
7. Limite a aproximadamente 200-300 palavras
8. Inclua chamadas para ação sutis
9. Destaque a localização e infraestrutura da região

Formato de saída:
- Primeiro parágrafo: gancho emocional e visão geral
- Segundo parágrafo: características principais e diferenciais  
- Terceiro parágrafo: localização e benefícios da região
- Quarto parágrafo: chamada para ação`;

    const userPrompt = `Melhore esta descrição de imóvel para conversão e SEO:

Descrição atual: ${description || 'Sem descrição'}

Informações do imóvel:
- Tipo: ${propertyInfo?.type || 'Não informado'}
- Status: ${propertyInfo?.status === 'venda' ? 'À venda' : 'Para alugar'}
- Quartos: ${propertyInfo?.bedrooms || 0}
- Suítes: ${propertyInfo?.suites || 0}
- Banheiros: ${propertyInfo?.bathrooms || 0}
- Vagas: ${propertyInfo?.garages || 0}
- Área: ${propertyInfo?.area || 0}m²
- Bairro: ${propertyInfo?.neighborhood || 'Não informado'}
- Cidade: ${propertyInfo?.city || 'Não informado'}

Gere uma descrição otimizada, profissional e persuasiva.`;

    console.log("Calling Lovable AI Gateway...");

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
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const improvedDescription = data.choices?.[0]?.message?.content;

    if (!improvedDescription) {
      throw new Error("No response from AI");
    }

    console.log("Description improved successfully");

    return new Response(JSON.stringify({ improvedDescription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in improve-description function:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro ao melhorar descrição" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
