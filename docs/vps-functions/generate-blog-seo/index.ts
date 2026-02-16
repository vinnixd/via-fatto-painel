import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractJson(raw: string): Record<string, string> {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  let jsonStr = match[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  return JSON.parse(jsonStr);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, category, content } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!title) {
      return new Response(JSON.stringify({ error: "Título é obrigatório para gerar SEO." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip HTML tags from content for context
    const plainContent = (content || '').replace(/<[^>]*>/g, '').substring(0, 500);

    const systemPrompt = `Você é um especialista em SEO para blogs imobiliários no Brasil.
Sua tarefa é gerar title tags e meta descriptions otimizados para Google.

REGRAS:
1. Title SEO: máximo 60 caracteres, palavra-chave principal no início
2. Meta Description: máximo 155 caracteres, incluir CTA
3. Linguagem persuasiva e profissional em português brasileiro
4. Incluir a categoria/tema quando relevante
5. Criar urgência e interesse para clicar
6. Não usar aspas no texto gerado

FORMATO DE SAÍDA (JSON):
{
  "seo_title": "título otimizado aqui",
  "seo_description": "descrição meta otimizada aqui"
}`;

    const userPrompt = `Gere SEO title e meta description para este artigo de blog:

Título: ${title}
Resumo: ${excerpt || 'Não informado'}
Categoria: ${category || 'Não informada'}
Trecho do conteúdo: ${plainContent || 'Não informado'}

Retorne APENAS o JSON com seo_title e seo_description.`;

    console.log("Generating blog SEO for:", title);

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
          { role: "user", content: userPrompt },
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
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) throw new Error("No response from AI");

    let seoData;
    try {
      seoData = extractJson(raw);
    } catch {
      seoData = {
        seo_title: title.substring(0, 60),
        seo_description: (excerpt || title).substring(0, 155),
      };
    }

    seoData.seo_title = (seoData.seo_title || '').substring(0, 60);
    seoData.seo_description = (seoData.seo_description || '').substring(0, 155);

    console.log("Blog SEO generated:", seoData);

    return new Response(JSON.stringify(seoData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-blog-seo:", error);
    const msg = error instanceof Error ? error.message : "Erro ao gerar SEO";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
