import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep } = await req.json();

    if (!cep) {
      return new Response(
        JSON.stringify({ error: "CEP is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean CEP - remove non-digits
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: "CEP must have 8 digits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Looking up CEP:", cleanCep);

    // Query ViaCEP API (free, no auth required)
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      console.error("ViaCEP API error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to lookup CEP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (data.erro) {
      console.log("CEP not found:", cleanCep);
      return new Response(
        JSON.stringify({ error: "CEP not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("CEP found:", data);

    // Return normalized address data
    return new Response(
      JSON.stringify({
        success: true,
        address: {
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
          zipcode: data.cep || cleanCep,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in lookup-cep:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
