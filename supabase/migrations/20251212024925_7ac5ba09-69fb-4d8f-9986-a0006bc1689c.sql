-- Add old_url column for migration reference
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS old_url TEXT DEFAULT NULL;

-- Create index for faster lookups during import
CREATE INDEX IF NOT EXISTS idx_properties_old_url ON public.properties(old_url);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);