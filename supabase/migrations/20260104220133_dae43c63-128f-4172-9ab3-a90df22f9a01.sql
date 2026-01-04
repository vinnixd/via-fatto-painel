-- Create role_permissions table to store granular permissions per role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  page_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role, page_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all permissions
CREATE POLICY "Admins can manage role_permissions"
ON public.role_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can view permissions (needed to check their own access)
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for each role
-- Admin has full access to everything
INSERT INTO public.role_permissions (role, page_key, can_view, can_create, can_edit, can_delete) VALUES
('admin', 'dashboard', true, true, true, true),
('admin', 'imoveis', true, true, true, true),
('admin', 'categorias', true, true, true, true),
('admin', 'mensagens', true, true, true, true),
('admin', 'favoritos', true, true, true, true),
('admin', 'usuarios', true, true, true, true),
('admin', 'dados', true, true, true, true),
('admin', 'configuracoes', true, true, true, true);

-- Gestor has access to most features
INSERT INTO public.role_permissions (role, page_key, can_view, can_create, can_edit, can_delete) VALUES
('gestor', 'dashboard', true, true, true, true),
('gestor', 'imoveis', true, true, true, true),
('gestor', 'categorias', true, true, true, true),
('gestor', 'mensagens', true, true, true, true),
('gestor', 'favoritos', true, true, true, false),
('gestor', 'usuarios', false, false, false, false),
('gestor', 'dados', true, true, true, false),
('gestor', 'configuracoes', true, false, true, false);

-- Marketing has access to content and marketing features
INSERT INTO public.role_permissions (role, page_key, can_view, can_create, can_edit, can_delete) VALUES
('marketing', 'dashboard', true, false, false, false),
('marketing', 'imoveis', true, true, true, false),
('marketing', 'categorias', true, false, false, false),
('marketing', 'mensagens', true, true, true, false),
('marketing', 'favoritos', true, false, false, false),
('marketing', 'usuarios', false, false, false, false),
('marketing', 'dados', true, true, false, false),
('marketing', 'configuracoes', true, false, false, false);

-- Corretor has limited access
INSERT INTO public.role_permissions (role, page_key, can_view, can_create, can_edit, can_delete) VALUES
('corretor', 'dashboard', true, false, false, false),
('corretor', 'imoveis', true, true, true, false),
('corretor', 'categorias', true, false, false, false),
('corretor', 'mensagens', true, true, false, false),
('corretor', 'favoritos', true, false, false, false),
('corretor', 'usuarios', false, false, false, false),
('corretor', 'dados', false, false, false, false),
('corretor', 'configuracoes', false, false, false, false);

-- User has minimal access
INSERT INTO public.role_permissions (role, page_key, can_view, can_create, can_edit, can_delete) VALUES
('user', 'dashboard', true, false, false, false),
('user', 'imoveis', true, false, false, false),
('user', 'categorias', false, false, false, false),
('user', 'mensagens', false, false, false, false),
('user', 'favoritos', true, false, false, false),
('user', 'usuarios', false, false, false, false),
('user', 'dados', false, false, false, false),
('user', 'configuracoes', false, false, false, false);