import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePropertyDescription(description: string): string {
  const text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const inputLines = text.split('\n');
  const outputLines: string[] = [];

  for (const rawLine of inputLines) {
    const line = rawLine.trim();
    if (!line) {
      outputLines.push('');
      continue;
    }

    const items = line.match(/[✓✔]\s*[^✓✔]+/g);
    if (items && items.length > 1) {
      items.forEach((it, idx) => {
        outputLines.push(it.trim());
        if (idx < items.length - 1) outputLines.push('');
      });
      continue;
    }

    outputLines.push(line);
  }

  return outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

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
      .select('id, title, type, status, bedrooms, suites, bathrooms, garages, area, built_area, address_neighborhood, address_city, description, features, amenities')
      .or('description.is.null,description.eq.');

    if (fetchError) throw fetchError;

    console.log(`Found ${properties?.length || 0} properties to update`);

    const typeLabels: Record<string, string> = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      terreno: 'Terreno',
      comercial: 'Imóvel Comercial',
      rural: 'Imóvel Rural',
      cobertura: 'Cobertura',
      flat: 'Flat',
      galpao: 'Galpão'
    };

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

    const results = { updated: 0, errors: [] as string[] };

    for (const property of properties || []) {
      try {
        const typeLabel = typeLabels[property.type] || 'Imóvel';
        const statusLabel = property.status === 'venda' ? 'à venda' : 'para alugar';

        const userPrompt = `Gere uma descrição de imóvel seguindo EXATAMENTE o formato especificado.

Informações do imóvel:
- Tipo: ${typeLabel}
- Status: ${statusLabel}
- Quartos: ${property.bedrooms || 0}
- Suítes: ${property.suites || 0}
- Banheiros: ${property.bathrooms || 0}
- Vagas: ${property.garages || 0}
- Área total: ${property.area || 0}m²
- Área construída: ${property.built_area || 0}m²
- Bairro: ${property.address_neighborhood || 'Não informado'}
- Cidade: ${property.address_city || 'Não informado'}
- Características: ${property.features?.join(', ') || 'Não informado'}
- Comodidades: ${property.amenities?.join(', ') || 'Não informado'}

Gere a descrição AGORA, seguindo o formato com subtítulo, introdução, lista de destaques com ✓, fechamento e CTA.`;

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
          const normalized = normalizePropertyDescription(newDescription);
          const { error: updateError } = await supabase
            .from('properties')
            .update({ description: normalized })
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
      } catch (err: unknown) {
        console.error(`Error processing ${property.title}:`, err);
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`${property.title}: ${errMessage}`);
      }
    }

    console.log("Batch update complete:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in batch-improve-descriptions:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
