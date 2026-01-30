-- Create notifications table for admin alerts
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can mark own notifications as read" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Create function to notify admins when new user registers
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notify all admin users about new pending registration
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_user.user_id,
      'new_registration',
      'Novo cadastro pendente',
      'Um novo usuário se cadastrou e aguarda aprovação: ' || NEW.name || ' (' || NEW.email || ')',
      jsonb_build_object('profile_id', NEW.id, 'email', NEW.email, 'name', NEW.name)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins on new pending user
CREATE TRIGGER trigger_notify_admins_new_user
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_admins_new_user();

-- Update handle_new_user to set status as pending by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_role app_role;
  user_status TEXT;
BEGIN
  -- Check if user has a valid invite
  SELECT role INTO invite_role 
  FROM public.invites 
  WHERE email = NEW.email 
    AND used_at IS NULL 
    AND expires_at > now()
  LIMIT 1;
  
  -- If has invite, status is active; otherwise pending
  IF invite_role IS NOT NULL THEN
    user_status := 'active';
  ELSE
    user_status := 'pending';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, name, email, creci, phone, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'creci', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    user_status
  );
  
  -- Add role (use invite role or default to 'user')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(invite_role, 'user'));
  
  RETURN NEW;
END;
$$;