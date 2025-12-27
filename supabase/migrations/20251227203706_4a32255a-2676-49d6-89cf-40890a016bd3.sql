-- Allow NULL values in condition column
ALTER TABLE public.properties ALTER COLUMN condition DROP NOT NULL;

-- Set default to NULL instead of 'usado'
ALTER TABLE public.properties ALTER COLUMN condition DROP DEFAULT;