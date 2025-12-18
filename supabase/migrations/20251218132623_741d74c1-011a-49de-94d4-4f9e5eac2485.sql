-- Add policy to allow users to delete their own properties (or admin/gestor)
CREATE POLICY "Users can delete own properties" 
ON public.properties 
FOR DELETE 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));