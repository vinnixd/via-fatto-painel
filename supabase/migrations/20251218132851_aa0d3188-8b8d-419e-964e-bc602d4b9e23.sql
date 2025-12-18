-- Allow all authenticated users to view portals
CREATE POLICY "Authenticated users can view portais" 
ON public.portais 
FOR SELECT 
USING (auth.uid() IS NOT NULL);