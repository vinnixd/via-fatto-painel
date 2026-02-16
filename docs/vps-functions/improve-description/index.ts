import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePropertyDescription(description: string): string {
  let text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  // Strip ALL markdown formatting aggressively
  text = text.replace(/^#{1,6}\s+/gm, '');           // ### headers
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');  // ***bold italic***
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');       // **bold**
  text = text.replace(/\*([^*]+)\*/g, '$1');            // *italic*
  text = text.replace(/___([^_]+)___/g, '$1');          // ___bold italic___
  text = text.replace(/__([^_]+)__/g, '$1');            // __bold__
  text = text.replace(/_([^_]+)_/g, '$1');              // _italic_
  text = text.replace(/~~([^~]+)~~/g, '$1');            // ~~strikethrough~~
  text = text.replace(/`([^`]+)`/g, '$1');              // `code`
  text = text.replace(/^>\s+/gm, '');                   // > blockquotes
  text = text.replace(/^---+$/gm, '');                  // --- horizontal rules
  text = text.replace(/^\*\*\*+$/gm, '');               // *** horizontal rules
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');  // [links](url)

  // Convert markdown lists to ✓
  text = text.replace(/^[-*•]\s+/gm, '✓ ');
  text = text.replace(/^\d+\.\s+/gm, '✓ ');

  // Remove section headers disguised as bold text (e.g. "**Localização Privilegiada:**")
  // These were already stripped above, but remove trailing colons from standalone label lines
  text = text.replace(/^([A-ZÀ-Ú][^✓\n]{3,50}):$/gm, '$1');

  const inputLines = text.split('\n');
  const outputLines: string[] = [];

  for (const rawLine of inputLines) {
    const line = rawLine.trim();
    if (!line) {
      outputLines.push('');
      continue;
    }

    // Split multiple ✓ items on same line
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
    const { description, propertyInfo } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const typeLabelMap: Record<string, string> = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      terreno: 'Terreno',
      comercial: 'Imóvel Comercial',
      rural: 'Imóvel Rural',
      cobertura: 'Cobertura',
      flat: 'Flat',
      galpao: 'Galpão'
    };
    const typeLabel = typeLabelMap[propertyInfo?.type as string] || 'Imóvel';

    const statusLabel = propertyInfo?.status === 'venda' ? 'à venda' : 'para alugar';

    const systemPrompt = `Você é um copywriter imobiliário. Reescreva descrições de imóveis em TEXTO PURO (plain text), sem NENHUMA formatação.

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
- Mais de 7 seções/blocos no total

OBRIGATÓRIO:
- Texto 100% plain text, sem formatação
- Itens da lista DEVEM começar com "✓ " (caractere Unicode checkmark + espaço)
- Máximo 150 palavras no total
- Português brasileiro`;

    const userPrompt = `Reescreva esta descrição de imóvel seguindo RIGOROSAMENTE o formato plain text especificado. Sem markdown, sem negrito, sem títulos.

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

${description ? `Descrição original para referência:\n${description}` : ''}

Responda APENAS com o texto plain text, sem explicações adicionais.`;

    console.log("Calling OpenAI API for description improvement...");

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
    let improvedDescription = data.choices?.[0]?.message?.content;

    if (improvedDescription) {
      improvedDescription = normalizePropertyDescription(improvedDescription);
    }

    if (!improvedDescription) {
      throw new Error("No response from AI");
    }

    console.log("Description improved successfully");

    return new Response(JSON.stringify({ improvedDescription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in improve-description function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao melhorar descrição";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});