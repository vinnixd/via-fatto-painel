-- Create import_jobs table to track CSV import progress
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'processing',
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  created_items INTEGER NOT NULL DEFAULT 0,
  updated_items INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all import jobs
CREATE POLICY "Admins can view all import jobs"
ON public.import_jobs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert import jobs
CREATE POLICY "Admins can insert import jobs"
ON public.import_jobs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow service role to update import jobs (for edge function)
CREATE POLICY "Service role can update import jobs"
ON public.import_jobs
FOR UPDATE
USING (true);

-- Enable realtime for import_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_jobs;