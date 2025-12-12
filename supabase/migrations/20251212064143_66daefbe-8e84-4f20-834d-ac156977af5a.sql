-- Add separate image field for home page presentation section
ALTER TABLE public.site_config 
ADD COLUMN home_image_url TEXT NULL;