-- Add favicon_url column to site_config table
ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;