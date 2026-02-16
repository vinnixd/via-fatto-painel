import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePropertyDescription(description: string): string {
  let text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  // Strip ALL markdown formatting aggressively
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/___([^_]+)___/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^---+$/gm, '');
  text = text.replace(/^\*\*\*+$/gm, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Convert markdown lists to ✓
  text = text.replace(/^[-*•]\s+/gm, '✓ ');
  text = text.replace(/^\d+\.\s+/gm, '✓ ');

  // Remove trailing colons from standalone label lines
  text = text.replace(/^([A-ZÀ-Ú][^✓\n]{3,50}):$/gm, '$1');

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

    const systemPrompt = `Você é um copywriter imobiliário. Gere descrições em TEXTO PURO (plain text), sem NENHUMA formatação.

ESTRUTURA OBRIGATÓRIA (5 blocos, separados por linha em branco):

1. Uma frase curta e impactante sobre o imóvel (máximo 15 palavras)

2. Parágrafo de apresentação (2-3 linhas curtas)

3. Lista de 5 a 7 destaques, cada um em sua própria linha começando com ✓ (checkmark). Máximo 8 palavras por item.

4. Frase de fechamento (1-2 linhas)

5. Chamada para ação (1 linha)

PROIBIDO — se você usar qualquer um destes, a resposta será REJEITADA:
- Asteriscos: ** ou * ou ***
- Hashtags: # ou ## ou ###
- Sublinhados: __ ou _texto_
- Markdown de qualquer tipo
- Títulos de seção como "Destaques:", "Localização:", "Diferenciais:"
- Parágrafos com mais de 3 linhas

OBRIGATÓRIO:
- Texto 100% plain text, sem formatação
- Itens da lista DEVEM começar com "✓ "
- Máximo 150 palavras no total
- Português brasileiro`;

    let processed = 0;
    let errors = 0;

    for (const property of properties) {
      try {
        const typeLabel = typeLabels[property.type] || 'Imóvel';
        const statusLabel = property.status === 'venda' ? 'à venda' : 'para alugar';

        const userPrompt = `Gere uma descrição de imóvel em texto puro, sem markdown.

Informações:
- Tipo: ${typeLabel} ${statusLabel}
- Quartos: ${property.bedrooms || 0} | Suítes: ${property.suites || 0}
- Banheiros: ${property.bathrooms || 0} | Vagas: ${property.garages || 0}
- Área: ${property.area || 0}m² | Construída: ${property.built_area || 0}m²
- Bairro: ${property.address_neighborhood || 'N/I'}
- Cidade: ${property.address_city || 'N/I'}
- Características: ${property.features?.join(', ') || 'N/I'}
- Comodidades: ${property.amenities?.join(', ') || 'N/I'}

Responda APENAS com o texto plain text.`;

        console.log(`Processing: ${property.title}`);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.7,
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