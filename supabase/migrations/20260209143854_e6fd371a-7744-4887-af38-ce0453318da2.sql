
-- Create blog_posts table
CREATE TABLE public.blog_posts (
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
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published blog posts"
ON public.blog_posts FOR SELECT
USING (published = true);

-- Tenant members can view all posts of their tenant
CREATE POLICY "Tenant members can view all blog posts"
ON public.blog_posts FOR SELECT
USING (is_tenant_member(tenant_id));

-- Tenant members can create posts for their tenant
CREATE POLICY "Tenant members can create blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (is_tenant_member(tenant_id));

-- Tenant members can update posts of their tenant
CREATE POLICY "Tenant members can update blog posts"
ON public.blog_posts FOR UPDATE
USING (is_tenant_member(tenant_id));

-- Tenant admins can delete posts
CREATE POLICY "Tenant admins can delete blog posts"
ON public.blog_posts FOR DELETE
USING (is_tenant_admin(tenant_id));

-- Admins (legacy role) full access
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_blog_posts_tenant_published ON public.blog_posts(tenant_id, published);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
