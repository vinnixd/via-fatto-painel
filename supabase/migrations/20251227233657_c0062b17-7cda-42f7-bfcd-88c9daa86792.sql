-- Create table for daily page views tracking
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL, -- 'property', 'home', 'properties', 'about', 'contact'
  page_slug TEXT, -- For property pages, stores the property slug
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_type, page_slug, view_date)
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for tracking
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- Allow public updates for incrementing counts
CREATE POLICY "Anyone can update page views" 
ON public.page_views 
FOR UPDATE 
USING (true);

-- Allow admins to read all page views
CREATE POLICY "Admins can read page views" 
ON public.page_views 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public read for aggregated data
CREATE POLICY "Public can read page views" 
ON public.page_views 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_page_views_date ON public.page_views(view_date);
CREATE INDEX idx_page_views_page_type ON public.page_views(page_type);

-- Create function to upsert page view
CREATE OR REPLACE FUNCTION public.track_page_view(
  p_page_type TEXT,
  p_page_slug TEXT DEFAULT NULL,
  p_property_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.page_views (page_type, page_slug, property_id, view_date, view_count)
  VALUES (p_page_type, p_page_slug, p_property_id, CURRENT_DATE, 1)
  ON CONFLICT (page_type, page_slug, view_date)
  DO UPDATE SET 
    view_count = page_views.view_count + 1,
    updated_at = now();
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.track_page_view TO anon, authenticated;