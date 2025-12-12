-- Add home image position field for storing focal point as object-position value
ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS home_image_position text DEFAULT '50% 50%';