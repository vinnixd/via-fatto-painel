import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FORBIDDEN_WORDS = [
  'imperdível', 'oportunidade', 'exclusivo', 'exclusiva', 'maravilhoso', 'maravilhosa',
  'incrível', 'fantástico', 'fantástica', 'espetacular', 'sensacional', 'único', 'única',
  'magnífico', 'magnífica', 'deslumbrante', 'surpreendente', 'extraordinário', 'extraordinária',
  'perfeito', 'perfeita', 'impecável', 'sonho', 'sonhos', 'luxuoso', 'luxuosa',
];

function containsForbiddenWords(title: string): boolean {
  const lower = title.toLowerCase();
  return FORBIDDEN_WORDS.some(w => lower.includes(w));
}

function hasLocation(title: string, neighborhood: string, city: string): boolean {
  const lower = title.toLowerCase();
  const nb = (neighborhood || '').toLowerCase();
  const ct = (city || '').toLowerCase();
  if (nb && lower.includes(nb)) return true;
  if (ct && lower.includes(ct)) return true;
  // Check for quadra pattern
  if (/quadra|\d{3}/.test(lower)) return true;
  return false;
}

const propertyTypeLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Imóvel Comercial',
  rural: 'Imóvel Rural',
  cobertura: 'Cobertura',
  flat: 'Flat',
  galpao: 'Galpão',
  loft: 'Loft',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, propertyInfo, variations } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const numVariations = variations ? 3 : 1;
    const type = propertyTypeLabels[propertyInfo?.type] || propertyInfo?.type || '';
    const bedrooms = propertyInfo?.bedrooms || 0;
    const suites = propertyInfo?.suites || 0;
    const garages = propertyInfo?.garages || 0;
    const area = propertyInfo?.area || 0;
    const neighborhood = propertyInfo?.neighborhood || '';
    const city = propertyInfo?.city || '';
    const features = propertyInfo?.features || [];
    const status = propertyInfo?.status === 'venda' ? 'à Venda' : 'para Alugar';

    // Extract quadra from street if present
    const street = propertyInfo?.street || '';
    const quadraMatch = street.match(/quadra\s*(\d+)/i) || street.match(/qd?\s*(\d+)/i) || street.match(/SQS?\s*(\d+)/i) || street.match(/SQN?\s*(\d+)/i);
    const quadra = quadraMatch ? quadraMatch[0] : '';

    // Build differentials list
    const differentials: string[] = [];
    const knownDifferentials = ['Reformado', 'Vista Livre', 'Nascente', 'Alto Padrão', 'Mobiliado', 'Andar Alto', 'Próximo ao Metrô', 'Varanda', 'Área Gourmet', 'Piscina', 'Churrasqueira', 'Jardim', 'Closet'];
    for (const feat of features) {
      for (const diff of knownDifferentials) {
        if (feat.toLowerCase().includes(diff.toLowerCase())) {
          differentials.push(diff);
        }
      }
    }

    // Build context string
    const contextParts: string[] = [];
    if (type) contextParts.push(`Tipo: ${type}`);
    if (bedrooms > 0) contextParts.push(`Quartos: ${bedrooms}`);
    if (suites > 0) contextParts.push(`Suítes: ${suites}`);
    if (garages > 0) contextParts.push(`Vagas: ${garages}`);
    if (area > 0) contextParts.push(`Área: ${area}m²`);
    if (neighborhood) contextParts.push(`Bairro: ${neighborhood}`);
    if (quadra) contextParts.push(`Quadra: ${quadra}`);
    if (city) contextParts.push(`Cidade: ${city}`);
    if (differentials.length > 0) contextParts.push(`Diferenciais: ${differentials.join(', ')}`);
    contextParts.push(`Status: ${status}`);

    const systemPrompt = `Você é um corretor imobiliário profissional experiente. Gere títulos de anúncios de imóveis que pareçam escritos por um especialista, NUNCA genéricos.

ESTRUTURA OBRIGATÓRIA (escolha a que melhor se aplica):
Opção A: [TIPO] + [QUARTOS] + [DIFERENCIAL PRINCIPAL] + [LOCALIZAÇÃO ESPECÍFICA]
Opção B: [TIPO] + [METRAGEM] + [DIFERENCIAL] + [BAIRRO/QUADRA]
Opção C: [QUARTOS ABREVIADO] + [DIFERENCIAL] + [METRAGEM] + [LOCALIZAÇÃO]

REGRAS RÍGIDAS:
1. Máximo 90 caracteres
2. Mínimo 30 caracteres
3. SEMPRE incluir localização específica (Quadra se existir, senão Bairro)
4. NUNCA usar estas palavras: ${FORBIDDEN_WORDS.join(', ')}
5. Priorizar diferenciais REAIS: Reformado, Vista Livre, Nascente, Alto Padrão, Mobiliado, Andar Alto
6. Se houver metragem relevante (>0), incluir
7. Evitar repetir palavras
8. Linguagem profissional e objetiva
9. Letra maiúscula no início de cada palavra importante
10. SEM pontuação no final
11. Pode abreviar quartos como "3Q" ou "4Q" para economizar caracteres
12. Para quadras em Brasília, usar formato curto: "na 313" ou "Quadra 313"

${numVariations > 1 ? `IMPORTANTE: Gere exatamente ${numVariations} variações diferentes, uma por linha. APENAS os títulos, sem numeração, sem explicação.` : 'IMPORTANTE: Retorne APENAS o título melhorado, sem explicações.'}`;

    const userPrompt = `${numVariations > 1 ? `Gere ${numVariations} variações de título` : 'Gere um título'} para este imóvel:

${contextParts.join('\n')}
${title ? `\nTítulo atual (para referência): "${title}"` : ''}

${numVariations > 1 ? `Retorne exatamente ${numVariations} títulos, um por linha.` : 'Retorne APENAS o título.'}`;

    console.log("Calling Lovable AI Gateway for title generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.8,
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
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error("No response from AI");
    }

    if (numVariations > 1) {
      // Parse multiple titles
      let titles = rawContent
        .split('\n')
        .map((line: string) => line.replace(/^\d+[\.\)\-]\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter((line: string) => line.length >= 20 && line.length <= 95);

      // Validate each title
      titles = titles.map((t: string) => {
        if (t.length > 90) {
          const cutAt = t.lastIndexOf(' ', 90);
          return cutAt > 30 ? t.substring(0, cutAt).trim() : t.substring(0, 90).trim();
        }
        return t;
      });

      // Take up to 3
      titles = titles.slice(0, 3);

      console.log("Titles generated:", titles);

      return new Response(JSON.stringify({ titles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      let improvedTitle = rawContent.replace(/^["']|["']$/g, '').trim();
      
      // Enforce 90 char limit
      if (improvedTitle.length > 90) {
        const cutAt = improvedTitle.lastIndexOf(' ', 90);
        improvedTitle = cutAt > 30 ? improvedTitle.substring(0, cutAt).trim() : improvedTitle.substring(0, 90).trim();
      }

      console.log("Title improved:", improvedTitle);

      return new Response(JSON.stringify({ improvedTitle }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    console.error("Error in improve-title function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao melhorar título";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
