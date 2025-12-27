-- Add shares counter to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS shares integer NOT NULL DEFAULT 0;