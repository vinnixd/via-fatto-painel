import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OLX OAuth Configuration
const OLX_AUTH_BASE = 'https://auth.olx.com.br';
const OLX_API_BASE = 'https://apps.olx.com.br';

// Get credentials from secrets (server-side only - never exposed to frontend)
const OLX_CLIENT_ID = Deno.env.get('OLX_CLIENT_ID')!;
const OLX_CLIENT_SECRET = Deno.env.get('OLX_CLIENT_SECRET')!;

interface OLXTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || url.searchParams.get('action');

    console.log(`[OLX OAuth] Action: ${action}`);

    // Validate that secrets are configured
    if (!OLX_CLIENT_ID || !OLX_CLIENT_SECRET) {
      console.error('[OLX OAuth] Missing OLX_CLIENT_ID or OLX_CLIENT_SECRET secrets');
      return new Response(
        JSON.stringify({ error: 'OLX OAuth não configurado. Configure OLX_CLIENT_ID e OLX_CLIENT_SECRET nos secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      // ============================================================
      // Generate Authorization URL with secure state
      // ============================================================
      case 'authorize': {
        const { portalId, tenantId, redirectUri } = body;

        if (!portalId) {
          return new Response(
            JSON.stringify({ error: 'Portal ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate secure random state
        const stateToken = crypto.randomUUID() + '-' + crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Store state in database for validation (CSRF protection)
        const { error: stateError } = await supabase
          .from('oauth_states')
          .insert({
            state: stateToken,
            portal_id: portalId,
            tenant_id: tenantId || null,
            expires_at: expiresAt,
          });

        if (stateError) {
          console.error('[OLX OAuth] Failed to store state:', stateError);
          return new Response(
            JSON.stringify({ error: 'Falha ao iniciar autorização' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Cleanup expired states
        try {
          await supabase.rpc('cleanup_expired_oauth_states');
        } catch {
          // Ignore cleanup errors
        }

        // Build OLX OAuth authorization URL
        const callbackUrl = `${supabaseUrl}/functions/v1/olx-oauth?action=callback`;
        
        const authUrl = new URL(`${OLX_AUTH_BASE}/authorize`);
        authUrl.searchParams.set('client_id', OLX_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', callbackUrl);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'autoupload basic_user_info');
        authUrl.searchParams.set('state', stateToken);

        console.log('[OLX OAuth] Generated auth URL for portal:', portalId);

        return new Response(
          JSON.stringify({ 
            authUrl: authUrl.toString(),
            state: stateToken,
            message: 'Redirecione o usuário para a URL de autorização'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // Handle OAuth Callback (browser redirect from OLX)
      // ============================================================
      case 'callback': {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        // Handle authorization errors
        if (error) {
          console.error('[OLX OAuth] Authorization error:', error, errorDescription);
          // Redirect to frontend with error
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--')}/admin/portais?oauth_error=${encodeURIComponent(errorDescription || error)}`,
            },
          });
        }

        if (!code || !state) {
          console.error('[OLX OAuth] Missing code or state');
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--')}/admin/portais?oauth_error=${encodeURIComponent('Parâmetros inválidos')}`,
            },
          });
        }

        // Validate state against database (CSRF protection)
        const { data: stateRecord, error: stateError } = await supabase
          .from('oauth_states')
          .select('*')
          .eq('state', state)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (stateError || !stateRecord) {
          console.error('[OLX OAuth] Invalid or expired state:', state);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--')}/admin/portais?oauth_error=${encodeURIComponent('State inválido ou expirado. Tente novamente.')}`,
            },
          });
        }

        const portalId = stateRecord.portal_id;

        // Delete used state
        await supabase.from('oauth_states').delete().eq('id', stateRecord.id);

        // Exchange authorization code for tokens
        const callbackUrl = `${supabaseUrl}/functions/v1/olx-oauth?action=callback`;
        
        console.log('[OLX OAuth] Exchanging code for tokens...');
        
        const tokenResponse = await fetch(`${OLX_AUTH_BASE}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: OLX_CLIENT_ID,
            client_secret: OLX_CLIENT_SECRET,
            redirect_uri: callbackUrl,
          }).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('[OLX OAuth] Token exchange failed:', tokenResponse.status, errorText);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--')}/admin/portais/${portalId}?oauth_error=${encodeURIComponent('Falha na troca do código por tokens')}`,
            },
          });
        }

        const tokens: OLXTokenResponse = await tokenResponse.json();
        console.log('[OLX OAuth] Tokens received successfully');

        // Get current portal config
        const { data: portal } = await supabase
          .from('portais')
          .select('config')
          .eq('id', portalId)
          .single();

        // Update portal config with OAuth tokens
        const expiresAt = Date.now() + (tokens.expires_in * 1000);
        const updatedConfig = {
          ...(portal?.config || {}),
          api_credentials: {
            ...(portal?.config?.api_credentials || {}),
            oauth: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: new Date(expiresAt).toISOString(),
              expires_in: tokens.expires_in,
              scope: tokens.scope || 'autoupload basic_user_info',
              token_type: tokens.token_type || 'Bearer',
              connected: true,
              connected_at: new Date().toISOString(),
            },
          },
        };

        const { error: updateError } = await supabase
          .from('portais')
          .update({ 
            config: updatedConfig, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', portalId);

        if (updateError) {
          console.error('[OLX OAuth] Failed to save tokens:', updateError);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--')}/admin/portais/${portalId}?oauth_error=${encodeURIComponent('Falha ao salvar tokens')}`,
            },
          });
        }

        // Log successful connection
        await supabase.from('portal_logs').insert({
          portal_id: portalId,
          status: 'success',
          total_itens: 0,
          detalhes: { action: 'oauth_connected', message: 'Conta OLX conectada com sucesso' },
        });

        console.log('[OLX OAuth] Tokens saved to portal config, redirecting to frontend');

        // Redirect back to portal config page with success
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--')}/admin/portais/${portalId}?oauth=success`,
          },
        });
      }

      // ============================================================
      // Refresh Access Token
      // ============================================================
      case 'refresh': {
        const { portalId } = body;

        if (!portalId) {
          return new Response(
            JSON.stringify({ error: 'Portal ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get portal config
        const { data: portal, error: portalError } = await supabase
          .from('portais')
          .select('*')
          .eq('id', portalId)
          .single();

        if (portalError || !portal) {
          return new Response(
            JSON.stringify({ error: 'Portal not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const refreshToken = portal.config?.api_credentials?.oauth?.refresh_token;

        if (!refreshToken) {
          return new Response(
            JSON.stringify({ error: 'Sem refresh token. Reconecte sua conta OLX.', needsReauth: true }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[OLX OAuth] Refreshing access token...');

        const tokenResponse = await fetch(`${OLX_AUTH_BASE}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: OLX_CLIENT_ID,
            client_secret: OLX_CLIENT_SECRET,
          }).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('[OLX OAuth] Token refresh failed:', tokenResponse.status, errorText);
          
          // Clear invalid tokens
          const clearedConfig = {
            ...portal.config,
            api_credentials: {
              ...portal.config?.api_credentials,
              oauth: {
                connected: false,
                connected_at: null,
                access_token: null,
                refresh_token: null,
                expires_at: null,
              },
            },
          };
          
          await supabase
            .from('portais')
            .update({ config: clearedConfig, updated_at: new Date().toISOString() })
            .eq('id', portalId);

          return new Response(
            JSON.stringify({ 
              error: 'Token refresh falhou. Reconecte sua conta OLX.', 
              needsReauth: true 
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens: OLXTokenResponse = await tokenResponse.json();
        console.log('[OLX OAuth] Token refreshed successfully');

        // Update portal config
        const expiresAt = Date.now() + (tokens.expires_in * 1000);
        const updatedConfig = {
          ...portal.config,
          api_credentials: {
            ...portal.config?.api_credentials,
            oauth: {
              ...portal.config?.api_credentials?.oauth,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || refreshToken,
              expires_at: new Date(expiresAt).toISOString(),
              expires_in: tokens.expires_in,
            },
          },
        };

        await supabase
          .from('portais')
          .update({ config: updatedConfig, updated_at: new Date().toISOString() })
          .eq('id', portalId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Token renovado com sucesso',
            expiresIn: tokens.expires_in
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // Disconnect OLX (remove tokens)
      // ============================================================
      case 'disconnect': {
        const { portalId } = body;

        if (!portalId) {
          return new Response(
            JSON.stringify({ error: 'Portal ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get portal config
        const { data: portal, error: portalError } = await supabase
          .from('portais')
          .select('*')
          .eq('id', portalId)
          .single();

        if (portalError || !portal) {
          return new Response(
            JSON.stringify({ error: 'Portal not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Clear OAuth tokens
        const updatedConfig = {
          ...portal.config,
          api_credentials: {
            ...portal.config?.api_credentials,
            oauth: {
              connected: false,
              connected_at: null,
              access_token: null,
              refresh_token: null,
              expires_at: null,
            },
          },
        };

        await supabase
          .from('portais')
          .update({ config: updatedConfig, updated_at: new Date().toISOString() })
          .eq('id', portalId);

        // Log disconnection
        await supabase.from('portal_logs').insert({
          portal_id: portalId,
          status: 'success',
          total_itens: 0,
          detalhes: { action: 'oauth_disconnected', message: 'Conta OLX desconectada' },
        });

        console.log('[OLX OAuth] Account disconnected for portal:', portalId);

        return new Response(
          JSON.stringify({ success: true, message: 'Conta OLX desconectada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // Test Connection (call OLX API to verify tokens work)
      // ============================================================
      case 'test': {
        const { portalId } = body;

        if (!portalId) {
          return new Response(
            JSON.stringify({ error: 'Portal ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get portal config
        const { data: portal, error: portalError } = await supabase
          .from('portais')
          .select('*')
          .eq('id', portalId)
          .single();

        if (portalError || !portal) {
          return new Response(
            JSON.stringify({ error: 'Portal not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const accessToken = portal.config?.api_credentials?.oauth?.access_token;

        if (!accessToken) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Conta não conectada. Conecte sua conta OLX primeiro.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if token is expired
        const expiresAt = portal.config?.api_credentials?.oauth?.expires_at;
        if (expiresAt && new Date(expiresAt) < new Date()) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Token expirado. Renove ou reconecte sua conta.', needsRefresh: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[OLX OAuth] Testing connection...');

        // Call OLX account endpoint to verify connection
        const accountResponse = await fetch(`${OLX_API_BASE}/autoupload/account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        });

        const logDetails: any = { 
          action: 'oauth_test', 
          status_code: accountResponse.status,
        };

        if (!accountResponse.ok) {
          const errorText = await accountResponse.text();
          console.error('[OLX OAuth] Test failed:', accountResponse.status, errorText);
          
          logDetails.error = errorText;
          logDetails.success = false;
          
          // Log test result (without sensitive data)
          await supabase.from('portal_logs').insert({
            portal_id: portalId,
            status: 'error',
            total_itens: 0,
            detalhes: logDetails,
          });

          if (accountResponse.status === 401 || accountResponse.status === 403) {
            return new Response(
              JSON.stringify({ ok: false, error: 'Token inválido ou expirado. Reconecte sua conta.', needsReauth: true }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: false, error: `Erro da API OLX: ${accountResponse.status}` }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const accountData = await accountResponse.json();
        console.log('[OLX OAuth] Test successful, account:', accountData.email || 'N/A');

        logDetails.success = true;
        logDetails.account_email = accountData.email;
        
        // Log success (without tokens)
        await supabase.from('portal_logs').insert({
          portal_id: portalId,
          status: 'success',
          total_itens: 0,
          detalhes: logDetails,
        });

        return new Response(
          JSON.stringify({ 
            ok: true, 
            message: 'Conexão validada com sucesso',
            account: {
              email: accountData.email,
              name: accountData.name,
              phone: accountData.phone,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // Check Token Status
      // ============================================================
      case 'status': {
        const { portalId } = body;

        if (!portalId) {
          return new Response(
            JSON.stringify({ error: 'Portal ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get portal config
        const { data: portal, error: portalError } = await supabase
          .from('portais')
          .select('*')
          .eq('id', portalId)
          .single();

        if (portalError || !portal) {
          return new Response(
            JSON.stringify({ error: 'Portal not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const oauth = portal.config?.api_credentials?.oauth;
        const accessToken = oauth?.access_token;
        const refreshToken = oauth?.refresh_token;
        const expiresAt = oauth?.expires_at;
        const connected = oauth?.connected === true;
        const connectedAt = oauth?.connected_at;

        const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
        const isExpired = expiresAtDate ? expiresAtDate < new Date() : !accessToken;
        const expiresIn = expiresAtDate ? Math.max(0, Math.floor((expiresAtDate.getTime() - Date.now()) / 1000)) : 0;

        return new Response(
          JSON.stringify({ 
            connected: connected && !!accessToken,
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            isExpired,
            expiresIn,
            expiresAt: expiresAt || null,
            connectedAt: connectedAt || null,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[OLX OAuth] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
