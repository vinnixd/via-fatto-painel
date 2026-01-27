-- Add status field to contacts table for sales funnel
ALTER TABLE public.contacts 
ADD COLUMN status text NOT NULL DEFAULT 'novo';

-- Add status_updated_at to track when status changes
ALTER TABLE public.contacts 
ADD COLUMN status_updated_at timestamp with time zone DEFAULT now();

-- Add comment for documentation
COMMENT ON COLUMN public.contacts.status IS 'Lead status in the sales funnel: novo, contatado, qualificado, visita_agendada, visitou, proposta, negociacao, fechado, perdido';
COMMENT ON COLUMN public.contacts.status_updated_at IS 'Timestamp of the last status change';