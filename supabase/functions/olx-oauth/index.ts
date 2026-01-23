import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OLX OAuth Configuration
const OLX_AUTH_BASE = 'https://auth.olx.com.br';
const OLX_API_BASE = 'https://apps.olx.com.br';

interface OLXTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface OLXAccountInfo {
  phone: string;
  email: string;
  name: string;
  id: string;
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

    switch (action) {
      // ============================================================
      // Generate Authorization URL
      // ============================================================
      case 'authorize': {
        const { portalId, clientId, redirectUri } = body;

        if (!portalId || !clientId) {
          return new Response(
            JSON.stringify({ error: 'Portal ID and Client ID are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate state parameter for security (includes portalId for callback)
        const state = btoa(JSON.stringify({ portalId, timestamp: Date.now() }));

        // OLX OAuth authorization URL
        // Scopes: autoupload (for publishing ads), basic_user_info (for account info)
        const authUrl = new URL(`${OLX_AUTH_BASE}/authorize`);
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri || `${supabaseUrl}/functions/v1/olx-oauth?action=callback`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'autoupload basic_user_info');
        authUrl.searchParams.set('state', state);

        console.log('[OLX OAuth] Generated auth URL:', authUrl.toString().substring(0, 100) + '...');

        return new Response(
          JSON.stringify({ 
            authUrl: authUrl.toString(),
            state,
            message: 'Redirecione o usuário para a URL de autorização'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // Handle OAuth Callback (exchange code for tokens)
      // ============================================================
      case 'callback': {
        const code = url.searchParams.get('code') || body.code;
        const state = url.searchParams.get('state') || body.state;
        const error = url.searchParams.get('error');

        if (error) {
          console.error('[OLX OAuth] Authorization error:', error);
          const errorDesc = url.searchParams.get('error_description') || 'Autorização negada pelo usuário';
          
          // Redirect to frontend with error
          const frontendUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/admin/portais?error=${encodeURIComponent(errorDesc)}`;
          return Response.redirect(frontendUrl, 302);
        }

        if (!code || !state) {
          return new Response(
            JSON.stringify({ error: 'Missing code or state parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Parse state to get portalId
        let stateData: { portalId: string };
        try {
          stateData = JSON.parse(atob(state));
        } catch (e) {
          return new Response(
            JSON.stringify({ error: 'Invalid state parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get portal config to retrieve client_id and client_secret
        const { data: portal, error: portalError } = await supabase
          .from('portais')
          .select('*')
          .eq('id', stateData.portalId)
          .single();

        if (portalError || !portal) {
          console.error('[OLX OAuth] Portal not found:', portalError);
          return new Response(
            JSON.stringify({ error: 'Portal not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const clientId = portal.config?.api_credentials?.client_id;
        const clientSecret = portal.config?.api_credentials?.client_secret;

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: 'Client credentials not configured' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exchange code for tokens
        console.log('[OLX OAuth] Exchanging code for tokens...');
        
        const tokenResponse = await fetch(`${OLX_AUTH_BASE}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: body.redirectUri || `${supabaseUrl}/functions/v1/olx-oauth?action=callback`,
          }).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('[OLX OAuth] Token exchange failed:', tokenResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Token exchange failed', details: errorText }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens: OLXTokenResponse = await tokenResponse.json();
        console.log('[OLX OAuth] Tokens received successfully');

        // Update portal config with new tokens
        const updatedConfig = {
          ...portal.config,
          api_credentials: {
            ...portal.config?.api_credentials,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: Date.now() + (tokens.expires_in * 1000),
          },
        };

        const { error: updateError } = await supabase
          .from('portais')
          .update({ config: updatedConfig, updated_at: new Date().toISOString() })
          .eq('id', stateData.portalId);

        if (updateError) {
          console.error('[OLX OAuth] Failed to save tokens:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to save tokens' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[OLX OAuth] Tokens saved to portal config');

        // For browser redirect flow, redirect to frontend with success
        if (req.headers.get('accept')?.includes('text/html')) {
          const frontendUrl = `${supabaseUrl.replace('supabase.co', 'lovable.app').replace('https://', 'https://id-preview--')}/admin/portais/${stateData.portalId}?oauth=success`;
          return Response.redirect(frontendUrl, 302);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Autorização OLX concluída com sucesso',
            expiresIn: tokens.expires_in
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // Exchange Code for Tokens (manual flow)
      // ============================================================
      case 'exchange': {
        const { portalId, code, redirectUri } = body;

        if (!portalId || !code) {
          return new Response(
            JSON.stringify({ error: 'Portal ID and code are required' }),
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

        const clientId = portal.config?.api_credentials?.client_id;
        const clientSecret = portal.config?.api_credentials?.client_secret;

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: 'Client credentials not configured' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(`${OLX_AUTH_BASE}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri || `${supabaseUrl}/functions/v1/olx-oauth?action=callback`,
          }).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('[OLX OAuth] Token exchange failed:', tokenResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Token exchange failed', details: errorText }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens: OLXTokenResponse = await tokenResponse.json();

        // Update portal config
        const updatedConfig = {
          ...portal.config,
          api_credentials: {
            ...portal.config?.api_credentials,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: Date.now() + (tokens.expires_in * 1000),
          },
        };

        await supabase
          .from('portais')
          .update({ config: updatedConfig, updated_at: new Date().toISOString() })
          .eq('id', portalId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Tokens obtidos com sucesso',
            expiresIn: tokens.expires_in
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

        const clientId = portal.config?.api_credentials?.client_id;
        const clientSecret = portal.config?.api_credentials?.client_secret;
        const refreshToken = portal.config?.api_credentials?.refresh_token;

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: 'Client credentials not configured' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!refreshToken) {
          return new Response(
            JSON.stringify({ error: 'No refresh token available. Please re-authorize.' }),
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
            client_id: clientId,
            client_secret: clientSecret,
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
              access_token: null,
              refresh_token: null,
              token_expires_at: null,
            },
          };
          
          await supabase
            .from('portais')
            .update({ config: clearedConfig, updated_at: new Date().toISOString() })
            .eq('id', portalId);

          return new Response(
            JSON.stringify({ 
              error: 'Token refresh failed. Please re-authorize.', 
              needsReauth: true 
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens: OLXTokenResponse = await tokenResponse.json();
        console.log('[OLX OAuth] Token refreshed successfully');

        // Update portal config
        const updatedConfig = {
          ...portal.config,
          api_credentials: {
            ...portal.config?.api_credentials,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || refreshToken, // Some OAuth servers don't return new refresh token
            token_expires_at: Date.now() + (tokens.expires_in * 1000),
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
      // Get Account Info
      // ============================================================
      case 'account': {
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

        const accessToken = portal.config?.api_credentials?.access_token;

        if (!accessToken) {
          return new Response(
            JSON.stringify({ error: 'Not authorized. Please connect your OLX account.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get account info from OLX
        const accountResponse = await fetch(`${OLX_API_BASE}/autoupload/account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        });

        if (!accountResponse.ok) {
          const errorText = await accountResponse.text();
          console.error('[OLX OAuth] Account info failed:', accountResponse.status, errorText);
          
          if (accountResponse.status === 401 || accountResponse.status === 403) {
            return new Response(
              JSON.stringify({ 
                error: 'Token expired. Please re-authorize.', 
                needsReauth: true 
              }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ error: 'Failed to get account info' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const accountData = await accountResponse.json();
        console.log('[OLX OAuth] Account info retrieved');

        return new Response(
          JSON.stringify({ 
            success: true, 
            account: accountData
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

        const accessToken = portal.config?.api_credentials?.access_token;
        const refreshToken = portal.config?.api_credentials?.refresh_token;
        const tokenExpiresAt = portal.config?.api_credentials?.token_expires_at;

        const isExpired = tokenExpiresAt ? Date.now() > tokenExpiresAt : true;
        const expiresIn = tokenExpiresAt ? Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000)) : 0;

        return new Response(
          JSON.stringify({ 
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            isExpired,
            expiresIn,
            expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null,
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
