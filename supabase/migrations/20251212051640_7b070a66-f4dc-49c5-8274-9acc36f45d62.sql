-- Add order_index column to properties table for custom ordering
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_properties_order_index ON public.properties(order_index);