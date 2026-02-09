
CREATE OR REPLACE FUNCTION public.notify_admins_overdue_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_user RECORD;
  invoice_amount TEXT;
BEGIN
  -- Only trigger when status changes to 'overdue'
  IF NEW.status = 'overdue' AND (OLD.status IS DISTINCT FROM 'overdue') THEN
    invoice_amount := 'R$ ' || replace(NEW.amount::numeric(10,2)::text, '.', ',');

    FOR admin_user IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        admin_user.user_id,
        'overdue_invoice',
        'Fatura em atraso',
        'A fatura no valor de ' || invoice_amount || ' com vencimento em ' || to_char(NEW.due_date::date, 'DD/MM/YYYY') || ' está em atraso.',
        jsonb_build_object('invoice_id', NEW.id, 'amount', NEW.amount, 'due_date', NEW.due_date)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_notify_admins_overdue_invoice
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_overdue_invoice();
