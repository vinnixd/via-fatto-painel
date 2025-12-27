-- Add watermark customization fields to site_config table
ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS watermark_opacity numeric DEFAULT 40,
ADD COLUMN IF NOT EXISTS watermark_size numeric DEFAULT 50;