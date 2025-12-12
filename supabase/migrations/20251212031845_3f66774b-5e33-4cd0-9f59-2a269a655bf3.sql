-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view favorites by hash" ON public.favorites;

-- Create a new policy that restricts access based on user_hash
-- Users can only view favorites that match their user_hash (passed via RPC or stored client-side)
CREATE POLICY "Users can view own favorites by hash"
ON public.favorites
FOR SELECT
USING (
  -- Allow if user_hash matches (for anonymous users viewing their own favorites)
  -- The client must pass the user_hash they have stored locally
  user_hash = coalesce(
    nullif(current_setting('request.headers', true)::json->>'x-user-hash', ''),
    ''
  )
  -- OR allow admins to view all
  OR has_role(auth.uid(), 'admin'::app_role)
);