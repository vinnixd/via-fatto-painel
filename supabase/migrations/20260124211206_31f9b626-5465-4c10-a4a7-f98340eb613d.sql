-- =====================================================
-- MULTI-TENANT SCHEMA FOR WHITE-LABEL ADMIN APP
-- =====================================================

-- 1) TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2) TENANT_USERS TABLE (linking users to tenants with roles)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Enable RLS on tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 3) DOMAINS TABLE (for white-label hostname resolution)
CREATE TABLE IF NOT EXISTS public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('public', 'admin')),
  is_primary boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  verify_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_hostname ON public.domains(hostname);
CREATE INDEX IF NOT EXISTS idx_domains_tenant_id ON public.domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
  )
$$;

-- Check if user is owner or admin of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
$$;

-- Check if user is owner of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_owner(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role = 'owner'
  )
$$;

-- Get user's role in a tenant
CREATE OR REPLACE FUNCTION public.get_tenant_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.tenant_users
  WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
  LIMIT 1
$$;

-- =====================================================
-- RLS POLICIES FOR TENANTS
-- =====================================================

-- Members can view their tenants
CREATE POLICY "Members can view their tenants"
ON public.tenants
FOR SELECT
USING (
  public.is_tenant_member(id)
);

-- Only owners can update tenant settings
CREATE POLICY "Owners can update tenants"
ON public.tenants
FOR UPDATE
USING (public.is_tenant_owner(id));

-- =====================================================
-- RLS POLICIES FOR TENANT_USERS
-- =====================================================

-- Members can view other members of their tenant
CREATE POLICY "Members can view tenant users"
ON public.tenant_users
FOR SELECT
USING (public.is_tenant_member(tenant_id));

-- Admins/Owners can insert new members
CREATE POLICY "Admins can add tenant users"
ON public.tenant_users
FOR INSERT
WITH CHECK (public.is_tenant_admin(tenant_id));

-- Admins/Owners can update members
CREATE POLICY "Admins can update tenant users"
ON public.tenant_users
FOR UPDATE
USING (public.is_tenant_admin(tenant_id));

-- Admins/Owners can delete members (except owners deleting themselves)
CREATE POLICY "Admins can delete tenant users"
ON public.tenant_users
FOR DELETE
USING (public.is_tenant_admin(tenant_id));

-- =====================================================
-- RLS POLICIES FOR DOMAINS
-- =====================================================

-- Anyone can read verified domains (needed for hostname resolution before auth)
CREATE POLICY "Anyone can read verified domains"
ON public.domains
FOR SELECT
USING (verified = true);

-- Members can view all domains of their tenant
CREATE POLICY "Members can view tenant domains"
ON public.domains
FOR SELECT
USING (public.is_tenant_member(tenant_id));

-- Admins can insert domains
CREATE POLICY "Admins can add domains"
ON public.domains
FOR INSERT
WITH CHECK (public.is_tenant_admin(tenant_id));

-- Admins can update domains
CREATE POLICY "Admins can update domains"
ON public.domains
FOR UPDATE
USING (public.is_tenant_admin(tenant_id));

-- Admins can delete domains
CREATE POLICY "Admins can delete domains"
ON public.domains
FOR DELETE
USING (public.is_tenant_admin(tenant_id));

-- =====================================================
-- ADD tenant_id TO EXISTING TABLES
-- =====================================================

-- Add tenant_id to properties if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
  END IF;
END $$;

-- Add tenant_id to contacts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
  END IF;
END $$;

-- Add tenant_id to favorites if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'favorites' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.favorites ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
  END IF;
END $$;

-- Add tenant_id to categories if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
  END IF;
END $$;

-- Add tenant_id to site_config if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_config' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.site_config ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
  END IF;
END $$;

-- Add tenant_id to portais if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portais' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.portais ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
  END IF;
END $$;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

CREATE OR REPLACE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tenant_users_updated_at
BEFORE UPDATE ON public.tenant_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DEFAULT TENANT (Via Fatto)
-- =====================================================

-- Insert default tenant if not exists
INSERT INTO public.tenants (id, name, slug, status)
SELECT 
  gen_random_uuid(),
  'Via Fatto',
  'viafatto',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE slug = 'viafatto'
);

-- Insert default admin domain
INSERT INTO public.domains (tenant_id, hostname, type, is_primary, verified, verify_token)
SELECT 
  t.id,
  'painel.viafatto.com.br',
  'admin',
  true,
  true,
  encode(gen_random_bytes(16), 'hex')
FROM public.tenants t
WHERE t.slug = 'viafatto'
AND NOT EXISTS (
  SELECT 1 FROM public.domains WHERE hostname = 'painel.viafatto.com.br'
);

-- Insert public domain
INSERT INTO public.domains (tenant_id, hostname, type, is_primary, verified, verify_token)
SELECT 
  t.id,
  'viafatto.com.br',
  'public',
  true,
  true,
  encode(gen_random_bytes(16), 'hex')
FROM public.tenants t
WHERE t.slug = 'viafatto'
AND NOT EXISTS (
  SELECT 1 FROM public.domains WHERE hostname = 'viafatto.com.br'
);