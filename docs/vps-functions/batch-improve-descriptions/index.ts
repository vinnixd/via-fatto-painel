import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePropertyDescription(description: string): string {
  let text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  // Strip markdown formatting
  text = text.replace(/^#{1,6}\s+/gm, '');       // headers
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');  // bold
  text = text.replace(/\*([^*]+)\*/g, '$1');       // italic
  text = text.replace(/__([^_]+)__/g, '$1');       // bold alt
  text = text.replace(/_([^_]+)_/g, '$1');         // italic alt

  // Convert markdown lists to ✓
  text = text.replace(/^[-*]\s+/gm, '✓ ');

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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get properties without descriptions or with short descriptions
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, type, status, bedrooms, suites, bathrooms, garages, area, built_area, address_neighborhood, address_city, description, features, amenities')
      .eq('active', true)
      .or('description.is.null,description.eq.')
      .limit(50);

    if (fetchError) throw fetchError;

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Todos os imóveis já possuem descrição",
        processed: 0,
        total: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${properties.length} properties to update`);

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

[SUBTÍTULO] - Uma linha curta e impactante sobre o imóvel
[INTRODUÇÃO] - Um parágrafo curto e envolvente (2-3 linhas)
[DESTAQUES] - Lista de 5 a 7 itens com "✓" no início de cada linha
[FECHAMENTO] - Uma frase curta destacando o valor do imóvel
[CTA] - Chamada para ação

REGRAS:
- NÃO use títulos como "Subtítulo:", "Introdução:", "Destaques:", etc.
- NÃO use formatação markdown: nada de **, ##, ###, *, _
- NÃO use negrito, itálico ou cabeçalhos
- Os itens da lista DEVEM começar com "✓ " (checkmark)
- Mantenha o texto em TEXTO PURO (plain text)
- Use português brasileiro`;

    let processed = 0;
    let errors = 0;

    for (const property of properties) {
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
          console.error(`OpenAI error for ${property.title}:`, response.status);
          errors++;
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
            console.error(`Update error for ${property.title}:`, updateError);
            errors++;
          } else {
            processed++;
            console.log(`Updated: ${property.title}`);
          }
        } else {
          errors++;
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error processing ${property.title}:`, err);
        errors++;
      }
    }

    console.log("Batch update complete:", { processed, errors });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Descrições melhoradas para ${processed} imóveis`,
      processed,
      errors,
      total: properties.length
    }), {
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
