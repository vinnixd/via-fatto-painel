import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyDomainRequest {
  hostname: string;
}

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

/**
 * Query DNS TXT records using Google's public DNS-over-HTTPS
 */
async function queryDnsTxt(hostname: string): Promise<string[]> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=TXT`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (!response.ok) {
      console.error('DNS query failed:', response.status);
      return [];
    }
    
    const data: DnsResponse = await response.json();
    
    if (data.Status !== 0 || !data.Answer) {
      return [];
    }
    
    // Extract TXT record values (remove quotes if present)
    return data.Answer
      .filter(answer => answer.type === 16) // TXT record type
      .map(answer => answer.data.replace(/^"|"$/g, ''));
  } catch (error) {
    console.error('Error querying DNS:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { hostname }: VerifyDomainRequest = await req.json();

    if (!hostname) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Hostname is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedHostname = hostname.toLowerCase().trim();
    console.log(`Verifying domain: ${normalizedHostname}`);

    // Fetch domain record
    const { data: domain, error: fetchError } = await supabase
      .from('domains')
      .select('*')
      .eq('hostname', normalizedHostname)
      .single();

    if (fetchError || !domain) {
      console.log('Domain not found:', normalizedHostname);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Domain not found',
          message: 'Este domínio não está cadastrado no sistema.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (domain.verified) {
      return new Response(
        JSON.stringify({ 
          ok: true, 
          verified: true,
          message: 'Este domínio já está verificado.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!domain.verify_token) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'No verification token',
          message: 'Token de verificação não encontrado. Tente remover e adicionar o domínio novamente.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query DNS for TXT record
    const txtHostname = `_zatch-verify.${normalizedHostname}`;
    console.log(`Querying DNS TXT: ${txtHostname}`);
    
    const txtRecords = await queryDnsTxt(txtHostname);
    console.log('TXT records found:', txtRecords);

    // Check if any TXT record contains the verification token
    const tokenFound = txtRecords.some(record => 
      record.includes(domain.verify_token)
    );

    if (!tokenFound) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          verified: false,
          error: 'Token not found in DNS',
          message: `Registro TXT não encontrado. Verifique se o registro _zatch-verify.${normalizedHostname} está configurado corretamente com o valor: ${domain.verify_token}`,
          expected_host: txtHostname,
          expected_value: domain.verify_token,
          found_records: txtRecords
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Token found - update domain as verified
    const { error: updateError } = await supabase
      .from('domains')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', domain.id);

    if (updateError) {
      console.error('Error updating domain:', updateError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Update failed',
          message: 'Falha ao atualizar o status do domínio. Tente novamente.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Domain verified successfully: ${normalizedHostname}`);
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        verified: true,
        message: 'Domínio verificado com sucesso!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-domain:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Internal error',
        message: 'Erro interno ao verificar domínio.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
