-- Add integrar_portais field to properties table
ALTER TABLE public.properties 
ADD COLUMN integrar_portais boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.integrar_portais IS 'Whether this property should be exported to real estate portals (ZAP, OLX, VivaReal, etc.)';

-- Create index for efficient filtering in portal feeds
CREATE INDEX idx_properties_integrar_portais ON public.properties(integrar_portais) WHERE integrar_portais = true AND active = true;