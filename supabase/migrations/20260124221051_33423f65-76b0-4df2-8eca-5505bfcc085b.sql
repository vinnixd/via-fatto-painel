-- Drop the restrictive policy we just created
DROP POLICY IF EXISTS "Public can read active tenants" ON public.tenants;

-- Create a PERMISSIVE policy instead (PERMISSIVE is the default)
CREATE POLICY "Public can read active tenants" 
  ON public.tenants 
  FOR SELECT 
  TO anon, authenticated
  USING (status = 'active');