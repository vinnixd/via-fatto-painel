import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: operator, error } = await supabase
      .from('zatch_operators')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('active', true)
      .single();

    if (error || !operator) {
      return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordMatch = await bcrypt.compare(password, operator.password_hash);

    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from('zatch_operators')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', operator.id);

    return new Response(JSON.stringify({
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        role: operator.role,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("operator-login error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
