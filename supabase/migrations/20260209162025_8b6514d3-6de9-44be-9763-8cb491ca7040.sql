
-- Create trigger function to notify admins when a new contact/lead is created
CREATE OR REPLACE FUNCTION public.notify_admins_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  lead_source TEXT;
BEGIN
  -- Map origin to friendly name
  CASE NEW.origem
    WHEN 'site' THEN lead_source := 'formulário do site';
    WHEN 'whatsapp' THEN lead_source := 'WhatsApp';
    WHEN 'portal' THEN lead_source := 'portal imobiliário';
    WHEN 'manual' THEN lead_source := 'cadastro manual';
    ELSE lead_source := NEW.origem;
  END CASE;

  -- Notify all admin users
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_user.user_id,
      'new_lead',
      'Novo lead recebido',
      'Novo lead via ' || lead_source || ': ' || NEW.name || ' (' || NEW.email || ')',
      jsonb_build_object('contact_id', NEW.id, 'name', NEW.name, 'email', NEW.email, 'origem', NEW.origem)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on contacts table
CREATE TRIGGER trigger_notify_admins_new_lead
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_lead();

-- Enable realtime for contacts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
