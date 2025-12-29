-- Update DELETE policy for properties to include marketing role
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties" 
ON public.properties 
FOR DELETE 
USING (
  (created_by = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
);

-- Update DELETE policy for property_images to include marketing role
DROP POLICY IF EXISTS "Users can delete property images" ON public.property_images;
CREATE POLICY "Users can delete property images" 
ON public.property_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id 
    AND (
      properties.created_by = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'gestor'::app_role)
      OR has_role(auth.uid(), 'marketing'::app_role)
    )
  )
);

-- Update favorites policy to allow marketing to delete favorites related to properties
DROP POLICY IF EXISTS "Marketing can delete favorites" ON public.favorites;
CREATE POLICY "Marketing can delete favorites" 
ON public.favorites 
FOR DELETE 
USING (has_role(auth.uid(), 'marketing'::app_role));