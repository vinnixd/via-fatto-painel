-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric NOT NULL DEFAULT 0,
  max_users integer NOT NULL DEFAULT 1,
  max_properties integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create subscriptions table (one per site/tenant)
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'suspended', 'trial')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  fiscal_name text,
  fiscal_document text,
  fiscal_cep text,
  fiscal_state text,
  fiscal_city text,
  fiscal_neighborhood text,
  fiscal_street text,
  fiscal_number text,
  fiscal_complement text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  payment_method text,
  invoice_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read, admin manage)
CREATE POLICY "Plans are publicly readable" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscriptions (admin only)
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for invoices (admin only)
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, description, monthly_price, annual_price, max_users, max_properties, features) VALUES
('Essencial', 'essencial', 'Plano ideal para corretores que estão crescendo.', 79, 63, 3, 300, '["IA integrada", "CRM Completo", "Site Imobiliário com SSL e SEO", "Site Otimizado com CDN", "Editor Visual do Site", "Integração com Portais"]'::jsonb),
('Impulso', 'impulso', 'Plano ideal para imobiliárias em expansão em ritmo acelerado.', 129, 103, 6, 800, '["IA integrada", "CRM Completo", "Site Imobiliário com SSL e SEO", "Site Otimizado com CDN", "Editor Visual do Site", "Integração com Portais"]'::jsonb),
('Escala', 'escala', 'Plano completo para imobiliárias com grandes equipes.', 199, 159, 12, 1600, '["IA integrada", "CRM Completo", "Site Imobiliário com SSL e SEO", "Site Otimizado com CDN", "Editor Visual do Site", "Integração com Portais"]'::jsonb);

-- Insert default subscription (Essencial plan for this tenant)
INSERT INTO public.subscriptions (plan_id, billing_cycle, status, started_at)
SELECT id, 'monthly', 'active', now()
FROM public.subscription_plans WHERE slug = 'essencial';