-- Add column for about image position
ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS about_image_position text DEFAULT 'center' CHECK (about_image_position IN ('top', 'center', 'bottom'));