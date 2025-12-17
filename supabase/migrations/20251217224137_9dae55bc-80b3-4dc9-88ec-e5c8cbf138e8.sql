-- Add status field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create invites table for invitation-only signup
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  role app_role NOT NULL DEFAULT 'corretor',
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invites
CREATE POLICY "Admins can manage invites"
ON public.invites
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create function to validate invite (public access)
CREATE OR REPLACE FUNCTION public.validate_invite(invite_token text)
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role app_role,
  is_valid boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.invites WHERE token = invite_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::text, NULL::app_role, 
      false, 'Convite não encontrado';
    RETURN;
  END IF;
  
  IF inv.used_at IS NOT NULL THEN
    RETURN QUERY SELECT 
      inv.id, inv.email, inv.name, inv.role,
      false, 'Este convite já foi utilizado';
    RETURN;
  END IF;
  
  IF inv.expires_at < now() THEN
    RETURN QUERY SELECT 
      inv.id, inv.email, inv.name, inv.role,
      false, 'Este convite expirou';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    inv.id, inv.email, inv.name, inv.role,
    true, NULL::text;
END;
$$;

-- Create function to mark invite as used
CREATE OR REPLACE FUNCTION public.use_invite(invite_token text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invites 
  SET used_at = now()
  WHERE token = invite_token 
    AND used_at IS NULL 
    AND expires_at > now();
  
  RETURN FOUND;
END;
$$;

-- Update handle_new_user to support role from invite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_role app_role;
BEGIN
  -- Get role from invite if exists
  SELECT role INTO invite_role 
  FROM public.invites 
  WHERE email = NEW.email 
    AND used_at IS NULL 
    AND expires_at > now()
  LIMIT 1;
  
  -- Insert profile
  INSERT INTO public.profiles (id, name, email, creci, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'creci', ''),
    'active'
  );
  
  -- Add role (use invite role or default to 'user')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(invite_role, 'user'));
  
  RETURN NEW;
END;
$$;

-- Create index for faster invite lookups
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);