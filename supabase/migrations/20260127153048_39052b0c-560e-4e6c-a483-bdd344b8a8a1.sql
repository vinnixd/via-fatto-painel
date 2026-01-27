-- Add origin field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN origem text NOT NULL DEFAULT 'site';

-- Add comment for documentation
COMMENT ON COLUMN public.contacts.origem IS 'Origin of the lead: site, whatsapp, manual, portal, etc.';