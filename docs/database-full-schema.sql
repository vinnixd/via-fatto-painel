-- ============================================================
-- SCHEMA COMPLETO DO PROJETO - PAINEL IMOBILIÁRIO MULTI-TENANT
-- Gerado em: 2026-02-12
-- Compatível com: Supabase (PostgreSQL 15+)
-- ============================================================
-- INSTRUÇÕES:
-- 1. Execute este arquivo no SQL Editor do Supabase externo
-- 2. Após executar, popule os dados iniciais com o bloco SEED no final
-- 3. Configure o .env com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
-- ============================================================

-- ============================================================
-- PARTE 1: ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'corretor', 'gestor', 'marketing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.documentation_status AS ENUM ('regular', 'irregular', 'pendente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.feed_format AS ENUM ('xml', 'json', 'csv');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.log_status AS ENUM ('success', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.portal_method AS ENUM ('feed', 'api', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.property_condition AS ENUM ('lancamento', 'novo', 'usado', 'pronto_para_morar');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.property_profile AS ENUM ('residencial', 'comercial', 'industrial', 'misto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.property_status AS ENUM ('venda', 'aluguel', 'vendido', 'alugado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.property_type AS ENUM ('casa', 'apartamento', 'terreno', 'comercial', 'rural', 'cobertura', 'flat', 'galpao', 'loft');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.publication_status AS ENUM ('pending', 'published', 'error', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PARTE 2: TABELAS
-- ============================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- TENANT_USERS
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'agent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DOMAINS
CREATE TABLE IF NOT EXISTS public.domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  hostname text NOT NULL,
  type text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  verify_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  creci text DEFAULT '',
  avatar_url text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  page_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PROPERTIES
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  title text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  type property_type NOT NULL DEFAULT 'casa',
  status property_status NOT NULL DEFAULT 'venda',
  profile property_profile NOT NULL DEFAULT 'residencial',
  condition property_condition,
  documentation documentation_status NOT NULL DEFAULT 'regular',
  address_street text DEFAULT '',
  address_neighborhood text DEFAULT '',
  address_city text NOT NULL DEFAULT '',
  address_state text NOT NULL DEFAULT '',
  address_zipcode text DEFAULT '',
  address_lat numeric,
  address_lng numeric,
  location_type text NOT NULL DEFAULT 'approximate',
  bedrooms integer NOT NULL DEFAULT 0,
  suites integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  garages integer NOT NULL DEFAULT 0,
  area numeric NOT NULL DEFAULT 0,
  built_area numeric,
  condo_fee numeric DEFAULT 0,
  condo_exempt boolean DEFAULT false,
  iptu numeric DEFAULT 0,
  financing boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  integrar_portais boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  order_index integer DEFAULT 0,
  features text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  reference text DEFAULT '',
  old_url text,
  seo_title text,
  seo_description text,
  category_id uuid REFERENCES public.categories(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PROPERTY_IMAGES
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  url text NOT NULL,
  alt text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CONTACTS (Leads/CRM)
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  property_id uuid REFERENCES public.properties(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  message text NOT NULL,
  origem text NOT NULL DEFAULT 'site',
  status text NOT NULL DEFAULT 'novo',
  read boolean NOT NULL DEFAULT false,
  status_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  user_hash text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- BLOG_POSTS
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text,
  cover_image_url text,
  category text,
  author_name text,
  author_avatar_url text,
  seo_title text,
  seo_description text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SITE_CONFIG
CREATE TABLE IF NOT EXISTS public.site_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) UNIQUE,
  logo_url text DEFAULT '',
  logo_horizontal_url text,
  logo_vertical_url text,
  logo_symbol_url text,
  favicon_url text,
  primary_color text DEFAULT '#0ea5e9',
  secondary_color text DEFAULT '#f97316',
  accent_color text DEFAULT '#10b981',
  hero_title text DEFAULT 'Encontre seu imóvel dos sonhos',
  hero_subtitle text DEFAULT 'A melhor seleção de imóveis da região',
  hero_background_url text DEFAULT '',
  home_image_url text,
  home_image_position text DEFAULT '50% 50%',
  whatsapp text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  about_title text DEFAULT 'Sobre Nós',
  about_text text DEFAULT '',
  about_image_url text DEFAULT '',
  about_image_position text DEFAULT 'center',
  footer_text text DEFAULT '',
  footer_links jsonb DEFAULT '[]'::jsonb,
  social_facebook text DEFAULT '',
  social_instagram text DEFAULT '',
  social_youtube text DEFAULT '',
  social_linkedin text DEFAULT '',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords text DEFAULT '',
  og_image_url text DEFAULT '',
  gtm_container_id text DEFAULT '',
  facebook_pixel_id text DEFAULT '',
  google_analytics_id text DEFAULT '',
  watermark_enabled boolean DEFAULT false,
  watermark_url text,
  watermark_opacity numeric DEFAULT 40,
  watermark_size numeric DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- INVITES
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  role app_role NOT NULL DEFAULT 'corretor',
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(8), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PAGE_VIEWS
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type text NOT NULL,
  page_slug text,
  property_id uuid REFERENCES public.properties(id),
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_type, page_slug, view_date)
);

-- IMPORT_JOBS
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  status text NOT NULL DEFAULT 'processing',
  total_items integer NOT NULL DEFAULT 0,
  processed_items integer NOT NULL DEFAULT 0,
  created_items integer NOT NULL DEFAULT 0,
  updated_items integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- PORTAIS
CREATE TABLE IF NOT EXISTS public.portais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  nome text NOT NULL,
  slug text NOT NULL,
  ativo boolean NOT NULL DEFAULT false,
  metodo portal_method NOT NULL DEFAULT 'feed',
  formato_feed feed_format NOT NULL DEFAULT 'xml',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  token_feed text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PORTAL_LOGS
CREATE TABLE IF NOT EXISTS public.portal_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id uuid NOT NULL REFERENCES public.portais(id),
  status log_status NOT NULL,
  total_itens integer NOT NULL DEFAULT 0,
  tempo_geracao_ms integer,
  feed_url text,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PORTAL_PUBLICACOES
CREATE TABLE IF NOT EXISTS public.portal_publicacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id uuid NOT NULL REFERENCES public.portais(id),
  imovel_id uuid NOT NULL REFERENCES public.properties(id),
  status publication_status NOT NULL DEFAULT 'pending',
  external_id text,
  mensagem_erro text,
  payload_snapshot jsonb,
  ultima_tentativa timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PORTAL_JOBS
CREATE TABLE IF NOT EXISTS public.portal_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id uuid NOT NULL REFERENCES public.portais(id),
  imovel_id uuid NOT NULL REFERENCES public.properties(id),
  action text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  last_error text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- OAUTH_STATES
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id uuid NOT NULL REFERENCES public.portais(id),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- SUBSCRIPTION_PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric NOT NULL DEFAULT 0,
  max_users integer NOT NULL DEFAULT 1,
  max_properties integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.subscription_plans(id),
  billing_cycle text NOT NULL DEFAULT 'monthly',
  billing_day integer DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  fiscal_name text,
  fiscal_document text,
  fiscal_cep text,
  fiscal_state text,
  fiscal_city text,
  fiscal_neighborhood text,
  fiscal_street text,
  fiscal_number text,
  fiscal_complement text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  due_date date NOT NULL,
  paid_at timestamptz,
  payment_method text,
  invoice_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTE 3: FUNÇÕES (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_owner(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_role(p_tenant_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tenant_users WHERE tenant_id = p_tenant_id AND user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_page_view(p_page_type text, p_page_slug text DEFAULT NULL, p_property_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.page_views (page_type, page_slug, property_id, view_date, view_count)
  VALUES (p_page_type, p_page_slug, p_property_id, CURRENT_DATE, 1)
  ON CONFLICT (page_type, page_slug, view_date)
  DO UPDATE SET view_count = page_views.view_count + 1, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite_role app_role;
  user_status TEXT;
BEGIN
  SELECT role INTO invite_role FROM public.invites
  WHERE email = NEW.email AND used_at IS NULL AND expires_at > now() LIMIT 1;

  IF invite_role IS NOT NULL THEN user_status := 'active';
  ELSE user_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, name, email, creci, phone, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'creci', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    user_status
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(invite_role, 'user'));

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_user RECORD;
BEGIN
  FOR admin_user IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_user.user_id, 'new_registration', 'Novo cadastro pendente',
      'Um novo usuário se cadastrou e aguarda aprovação: ' || NEW.name || ' (' || NEW.email || ')',
      jsonb_build_object('profile_id', NEW.id, 'email', NEW.email, 'name', NEW.name)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_new_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_user RECORD;
  lead_source TEXT;
BEGIN
  CASE NEW.origem
    WHEN 'site' THEN lead_source := 'formulário do site';
    WHEN 'whatsapp' THEN lead_source := 'WhatsApp';
    WHEN 'portal' THEN lead_source := 'portal imobiliário';
    WHEN 'manual' THEN lead_source := 'cadastro manual';
    ELSE lead_source := NEW.origem;
  END CASE;

  FOR admin_user IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_user.user_id, 'new_lead', 'Novo lead recebido',
      'Novo lead via ' || lead_source || ': ' || NEW.name || ' (' || NEW.email || ')',
      jsonb_build_object('contact_id', NEW.id, 'name', NEW.name, 'email', NEW.email, 'origem', NEW.origem)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_overdue_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_user RECORD;
  invoice_amount TEXT;
BEGIN
  IF NEW.status = 'overdue' AND (OLD.status IS DISTINCT FROM 'overdue') THEN
    invoice_amount := 'R$ ' || replace(NEW.amount::numeric(10,2)::text, '.', ',');
    FOR admin_user IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        admin_user.user_id, 'overdue_invoice', 'Fatura em atraso',
        'A fatura no valor de ' || invoice_amount || ' com vencimento em ' || to_char(NEW.due_date::date, 'DD/MM/YYYY') || ' está em atraso.',
        jsonb_build_object('invoice_id', NEW.id, 'amount', NEW.amount, 'due_date', NEW.due_date)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_invite(invite_token text)
RETURNS TABLE(id uuid, email text, name text, role app_role, is_valid boolean, error_message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.invites WHERE token = invite_token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::app_role, false, 'Convite não encontrado';
    RETURN;
  END IF;
  IF inv.used_at IS NOT NULL THEN
    RETURN QUERY SELECT inv.id, inv.email, inv.name, inv.role, false, 'Este convite já foi utilizado';
    RETURN;
  END IF;
  IF inv.expires_at < now() THEN
    RETURN QUERY SELECT inv.id, inv.email, inv.name, inv.role, false, 'Este convite expirou';
    RETURN;
  END IF;
  RETURN QUERY SELECT inv.id, inv.email, inv.name, inv.role, true, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_invite(invite_token text, user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.invites SET used_at = now()
  WHERE token = invite_token AND used_at IS NULL AND expires_at > now();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$;

-- ============================================================
-- PARTE 4: TRIGGERS
-- ============================================================

-- Auth trigger (executar após criar a função handle_new_user)
-- NOTA: Este trigger precisa ser criado no schema auth via Dashboard > SQL Editor
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notificar admins sobre novos cadastros pendentes
CREATE OR REPLACE TRIGGER trigger_notify_admins_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_admins_new_user();

-- Notificar admins sobre novos leads
CREATE OR REPLACE TRIGGER trigger_notify_admins_new_lead
  AFTER INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_lead();

-- Notificar admins sobre faturas vencidas
CREATE OR REPLACE TRIGGER on_invoice_overdue
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_overdue_invoice();

-- ============================================================
-- PARTE 5: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- TENANTS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active tenants" ON public.tenants FOR SELECT USING (status = 'active');
CREATE POLICY "Members can view their tenants" ON public.tenants FOR SELECT USING (is_tenant_member(id));
CREATE POLICY "Owners can update tenants" ON public.tenants FOR UPDATE USING (is_tenant_owner(id));

-- TENANT_USERS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view tenant users" ON public.tenant_users FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Admins can add tenant users" ON public.tenant_users FOR INSERT WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "Admins can update tenant users" ON public.tenant_users FOR UPDATE USING (is_tenant_admin(tenant_id));
CREATE POLICY "Admins can delete tenant users" ON public.tenant_users FOR DELETE USING (is_tenant_admin(tenant_id));

-- DOMAINS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read verified domains" ON public.domains FOR SELECT USING (verified = true);
CREATE POLICY "Members can view tenant domains" ON public.domains FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Admins can add domains" ON public.domains FOR INSERT WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "Admins can update domains" ON public.domains FOR UPDATE USING (is_tenant_admin(tenant_id));
CREATE POLICY "Admins can delete domains" ON public.domains FOR DELETE USING (is_tenant_admin(tenant_id));

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile or admins can update any" ON public.profiles FOR UPDATE USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ROLE_PERMISSIONS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view role_permissions" ON public.role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROPERTIES
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are publicly readable" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Admins can manage properties" ON public.properties FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'marketing'));
CREATE POLICY "Users can delete own properties" ON public.properties FOR DELETE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'marketing'));

-- PROPERTY_IMAGES
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property images are publicly readable" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage property images" ON public.property_images FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert property images" ON public.property_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update property images" ON public.property_images FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND (properties.created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'marketing'))));
CREATE POLICY "Users can delete property images" ON public.property_images FOR DELETE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND (properties.created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'marketing'))));

-- CONTACTS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage contacts" ON public.contacts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- FAVORITES
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own favorites by hash" ON public.favorites FOR SELECT USING (user_hash = COALESCE(NULLIF((current_setting('request.headers', true)::json->>'x-user-hash'), ''), '') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage favorites" ON public.favorites FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Marketing can delete favorites" ON public.favorites FOR DELETE USING (has_role(auth.uid(), 'marketing'));

-- BLOG_POSTS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published blog posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Tenant members can view all blog posts" ON public.blog_posts FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Tenant members can create blog posts" ON public.blog_posts FOR INSERT WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY "Tenant members can update blog posts" ON public.blog_posts FOR UPDATE USING (is_tenant_member(tenant_id));
CREATE POLICY "Tenant admins can delete blog posts" ON public.blog_posts FOR DELETE USING (is_tenant_admin(tenant_id));
CREATE POLICY "Admins can manage all blog posts" ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- SITE_CONFIG
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site config is publicly readable" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage site config" ON public.site_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own notifications as read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- INVITES
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invites" ON public.invites FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PAGE_VIEWS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update page views" ON public.page_views FOR UPDATE USING (true);
CREATE POLICY "Public can read page views" ON public.page_views FOR SELECT USING (true);
CREATE POLICY "Admins can read page views" ON public.page_views FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- IMPORT_JOBS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all import jobs" ON public.import_jobs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert import jobs" ON public.import_jobs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can update import jobs" ON public.import_jobs FOR UPDATE USING (true);

-- PORTAIS
ALTER TABLE public.portais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view portais" ON public.portais FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage portais" ON public.portais FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PORTAL_LOGS
ALTER TABLE public.portal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage portal_logs" ON public.portal_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PORTAL_PUBLICACOES
ALTER TABLE public.portal_publicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage portal_publicacoes" ON public.portal_publicacoes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PORTAL_JOBS
ALTER TABLE public.portal_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage portal_jobs" ON public.portal_jobs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- OAUTH_STATES
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.oauth_states FOR ALL USING (true);

-- SUBSCRIPTION_PLANS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'admin'));

-- SUBSCRIPTIONS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- PARTE 6: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies para property-images
CREATE POLICY "Public can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update property images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete property images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

-- Storage policies para site-assets
CREATE POLICY "Public can view site assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Authenticated can upload site assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update site assets" ON storage.objects FOR UPDATE USING (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete site assets" ON storage.objects FOR DELETE USING (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);

-- ============================================================
-- PARTE 7: REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_images;

-- ============================================================
-- PARTE 8: SEED (DADOS INICIAIS)
-- ============================================================

-- Planos de assinatura
INSERT INTO public.subscription_plans (name, slug, description, monthly_price, annual_price, max_users, max_properties, features, is_active)
VALUES
  ('Essencial', 'essencial', 'Ideal para corretores autônomos', 79, 758.40, 2, 70,
   '["Site profissional", "CRM de leads", "Editor visual", "Ferramentas de IA", "Integração com portais", "Suporte por e-mail"]'::jsonb, true),
  ('Impulso', 'impulso', 'Para imobiliárias em crescimento', 129, 1238.40, 6, 300,
   '["Tudo do Essencial", "Múltiplos usuários", "Relatórios avançados", "Domínio personalizado", "Suporte prioritário", "Blog integrado"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Criar assinatura ativa (vincule ao plano desejado)
INSERT INTO public.subscriptions (plan_id, billing_cycle, status, started_at)
SELECT id, 'monthly', 'active', now()
FROM public.subscription_plans WHERE slug = 'essencial' LIMIT 1;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
