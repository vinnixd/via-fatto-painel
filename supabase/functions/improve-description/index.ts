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

    const typeLabel = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      terreno: 'Terreno',
      comercial: 'Imóvel Comercial',
      rural: 'Imóvel Rural',
      cobertura: 'Cobertura',
      flat: 'Flat',
      galpao: 'Galpão'
    }[propertyInfo?.type] || 'Imóvel';

    const statusLabel = propertyInfo?.status === 'venda' ? 'à venda' : 'para alugar';

    const systemPrompt = `Você é um especialista em marketing imobiliário. Gere descrições de imóveis SEMPRE neste formato EXATO:

FORMATO OBRIGATÓRIO (siga exatamente esta estrutura):

[SUBTÍTULO] - Uma linha curta e impactante sobre o imóvel (ex: "Apartamento impecável à venda — 157m² de puro conforto e sofisticação")

[INTRODUÇÃO] - Um parágrafo curto e envolvente (2-3 linhas) apresentando o imóvel.

[DESTAQUES] - Lista de 5 a 7 itens com "✓" no início de cada linha. Cada item deve ser curto (até 6 palavras). Exemplos:
✓ 2 suítes espaçosas
✓ 3 vagas de garagem
✓ Acabamentos de alto padrão
✓ Mobiliário de excelente qualidade
✓ Living integrado e iluminado
✓ Pronto para morar — é entrar e se apaixonar!

[FECHAMENTO] - Uma frase curta destacando o valor do imóvel (1-2 linhas).

[CTA] - Chamada para ação (ex: "Agende sua visita e surpreenda-se!")

REGRAS:
- NÃO use títulos como "Subtítulo:", "Introdução:", "Destaques:", etc.
- NÃO escreva parágrafos longos
- Os itens da lista DEVEM começar com "✓ " (checkmark)
- Mantenha o texto CONCISO e ORGANIZADO
- Use português brasileiro`;

    const userPrompt = `Gere uma descrição de imóvel seguindo EXATAMENTE o formato especificado.

Informações do imóvel:
- Tipo: ${typeLabel}
- Status: ${statusLabel}
- Quartos: ${propertyInfo?.bedrooms || 0}
- Suítes: ${propertyInfo?.suites || 0}
- Banheiros: ${propertyInfo?.bathrooms || 0}
- Vagas: ${propertyInfo?.garages || 0}
- Área total: ${propertyInfo?.area || 0}m²
- Área construída: ${propertyInfo?.built_area || 0}m²
- Bairro: ${propertyInfo?.neighborhood || 'Não informado'}
- Cidade: ${propertyInfo?.city || 'Não informado'}
- Características: ${propertyInfo?.features?.join(', ') || 'Não informado'}
- Comodidades: ${propertyInfo?.amenities?.join(', ') || 'Não informado'}

${description ? `Descrição original para referência: ${description}` : ''}

Gere a descrição AGORA, seguindo o formato com subtítulo, introdução, lista de destaques com ✓, fechamento e CTA.`;

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
