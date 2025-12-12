-- Add active column to properties table for visibility control
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_properties_active ON public.properties(active);