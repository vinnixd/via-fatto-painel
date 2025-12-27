-- Create enum for property condition
CREATE TYPE public.property_condition AS ENUM ('lancamento', 'novo', 'usado');

-- Add condition column to properties table
ALTER TABLE public.properties 
ADD COLUMN condition public.property_condition NOT NULL DEFAULT 'usado';