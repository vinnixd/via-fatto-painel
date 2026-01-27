-- Create table for OAuth state validation (CSRF protection)
CREATE TABLE public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  portal_id UUID NOT NULL REFERENCES public.portais(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Index for quick lookups
CREATE INDEX idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX idx_oauth_states_expires_at ON public.oauth_states(expires_at);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Policies: Service role can manage, authenticated users can insert for their portals
CREATE POLICY "Service role full access" ON public.oauth_states
FOR ALL USING (true);

-- Auto-cleanup of expired states (function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$;

-- Add oauth column to portais.config for cleaner structure
-- Update the api_credentials structure comment: 
-- oauth: { access_token, refresh_token, expires_at, scope, token_type, connected, connected_at }