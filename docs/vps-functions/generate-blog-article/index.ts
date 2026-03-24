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
    const { tema, cidade, publico, palavraChave, tom } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!tema) {
      return new Response(JSON.stringify({ error: "O tema do artigo é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tomDescricao = {
      tecnico: "Use linguagem técnica e profissional, com dados e informações precisas.",
      simples: "Use linguagem simples, acessível e fácil de entender para leigos.",
      vendedor: "Use linguagem persuasiva focada em conversão, com CTAs e urgência.",
    }[tom] || "Use linguagem profissional mas acessível, equilibrando informação com persuasão.";

    const systemPrompt = `Você é um redator especialista em marketing imobiliário e SEO no Brasil.
Sua missão é criar artigos completos, otimizados para Google e que convertam leitores em leads.

REGRAS OBRIGATÓRIAS:
1. Escreva em português brasileiro fluente e natural
2. O artigo deve ter entre 1200 e 2000 palavras
3. Use HTML para formatação (h2, h3, p, ul, li, strong, em)
4. Inclua dados reais do mercado imobiliário quando possível
5. Otimize para SEO com a palavra-chave distribuída naturalmente
6. ${tomDescricao}
7. NÃO use markdown, apenas HTML
8. NÃO use aspas no texto gerado dos campos JSON
9. Crie conteúdo original e relevante, evitando clichês genéricos

ESTRUTURA DO ARTIGO:
- Introdução envolvente (2-3 parágrafos)
- 3-5 seções com H2 e sub-seções com H3
- Dados e estatísticas quando relevante
- Dicas práticas e acionáveis
- Conclusão com CTA

FORMATO DE SAÍDA (JSON ESTRITO):
{
  "title": "título principal do artigo (máx 80 chars)",
  "subtitle": "subtítulo complementar (máx 120 chars)",
  "excerpt": "resumo envolvente para preview (máx 250 chars)",
  "content": "conteúdo completo em HTML",
  "category": "categoria mais adequada",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "faq": [
    {"question": "pergunta frequente 1", "answer": "resposta completa 1"},
    {"question": "pergunta frequente 2", "answer": "resposta completa 2"},
    {"question": "pergunta frequente 3", "answer": "resposta completa 3"}
  ],
  "seo_title": "título SEO otimizado (máx 60 chars)",
  "seo_description": "meta description otimizada (máx 155 chars)"
}`;

    const userPrompt = `Crie um artigo completo sobre o seguinte tema para um blog imobiliário:

TEMA: ${tema}
${cidade ? `CIDADE/REGIÃO: ${cidade}` : ''}
${publico ? `PÚBLICO-ALVO: ${publico}` : ''}
${palavraChave ? `PALAVRA-CHAVE PRINCIPAL: ${palavraChave}` : ''}

O artigo deve ser completo, informativo e otimizado para SEO.
${palavraChave ? `Distribua a palavra-chave "${palavraChave}" naturalmente pelo texto.` : ''}
${cidade ? `Contextualize o conteúdo para a região de ${cidade}.` : ''}

Retorne APENAS o JSON no formato especificado, sem texto adicional.`;

    console.log("Generating blog article for:", tema);

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) throw new Error("No response from AI");

    let articleData;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      throw new Error("Erro ao processar resposta da IA. Tente novamente.");
    }

    if (!articleData.title || !articleData.content) {
      throw new Error("Resposta incompleta da IA. Tente novamente.");
    }

    articleData.tags = Array.isArray(articleData.tags) ? articleData.tags : [];
    articleData.faq = Array.isArray(articleData.faq) ? articleData.faq : [];
    articleData.seo_title = (articleData.seo_title || articleData.title || '').substring(0, 60);
    articleData.seo_description = (articleData.seo_description || articleData.excerpt || '').substring(0, 155);

    console.log("Blog article generated successfully:", articleData.title);

    return new Response(JSON.stringify(articleData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-blog-article:", error);
    const msg = error instanceof Error ? error.message : "Erro ao gerar artigo";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
