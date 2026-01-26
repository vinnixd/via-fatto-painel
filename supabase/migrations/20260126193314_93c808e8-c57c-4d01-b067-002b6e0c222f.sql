-- Add billing_day column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN billing_day integer DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28);

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.billing_day IS 'Preferred billing day of month (1-28) for automatic invoice generation';