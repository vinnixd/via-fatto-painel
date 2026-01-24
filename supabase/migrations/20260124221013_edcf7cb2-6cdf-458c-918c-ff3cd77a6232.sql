-- Allow public read of basic tenant info for initial resolution
CREATE POLICY "Public can read active tenants" 
  ON public.tenants 
  FOR SELECT 
  USING (status = 'active');