CREATE OR REPLACE FUNCTION public.protect_profile_billing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.credits := OLD.credits;
    NEW.credits_used := OLD.credits_used;
    NEW.plan := OLD.plan;
    NEW.billing_cycle := OLD.billing_cycle;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.protect_profile_billing() FROM PUBLIC;

CREATE TRIGGER profiles_protect_billing BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing();