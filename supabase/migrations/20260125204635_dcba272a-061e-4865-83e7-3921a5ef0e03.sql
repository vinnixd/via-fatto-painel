-- Enable realtime for site_config table
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_config;

-- Enable realtime for properties table
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;

-- Enable realtime for property_images table
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_images;