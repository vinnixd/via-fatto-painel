-- Add watermark fields to site_config table
ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS watermark_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_enabled boolean DEFAULT false;