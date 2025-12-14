-- Add condo fee and IPTU fields to properties table
ALTER TABLE public.properties
ADD COLUMN condo_fee numeric DEFAULT 0,
ADD COLUMN condo_exempt boolean DEFAULT false,
ADD COLUMN iptu numeric DEFAULT 0;