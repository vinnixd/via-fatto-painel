import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECT_REF = "wzllexcaitqfkfjmqbyy";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      const hasManagementToken = !!Deno.env.get("SUPABASE_ACCESS_TOKEN");

      return new Response(JSON.stringify({
        anthropic: {
          configured: !!anthropicKey,
          active: !!anthropicKey,
          masked_key: anthropicKey ? `sk-ant-...${anthropicKey.slice(-4)}` : null,
        },
        openai: {
          configured: !!openaiKey,
          active: !anthropicKey && !!openaiKey,
          masked_key: openaiKey ? `sk-...${openaiKey.slice(-4)}` : null,
        },
        active_provider: anthropicKey ? 'anthropic' : (openaiKey ? 'openai' : null),
        can_manage_remotely: hasManagementToken,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'POST') {
      const { action, provider, api_key } = await req.json();

      const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN");

      if (!SUPABASE_ACCESS_TOKEN) {
        return new Response(JSON.stringify({
          error: "SUPABASE_ACCESS_TOKEN não configurado. Adicione este secret no Supabase para habilitar o gerenciamento remoto de chaves de API.",
          code: "NO_MANAGEMENT_TOKEN",
        }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const secretName = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';

      if (action === 'set') {
        if (!api_key || api_key.trim().length < 10) {
          return new Response(JSON.stringify({ error: "Chave de API inválida" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ name: secretName, value: api_key.trim() }]),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Management API error ${res.status}: ${errText}`);
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Chave ${secretName} atualizada com sucesso. Aguarde alguns segundos para as edge functions recarregarem.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === 'delete') {
        const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([secretName]),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Management API error ${res.status}: ${errText}`);
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Chave ${secretName} removida. O provedor alternativo será usado automaticamente.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("manage-ai-keys error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
