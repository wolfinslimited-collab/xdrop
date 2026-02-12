
CREATE OR REPLACE FUNCTION public.update_agent_usdc_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_id uuid;
BEGIN
  IF NEW.status = 'completed' AND NEW.earnings IS NOT NULL AND NEW.earnings > 0 THEN
    -- Update agent earnings
    UPDATE public.agents
    SET usdc_earnings = COALESCE(usdc_earnings, 0) + NEW.earnings
    WHERE id = NEW.agent_id;

    -- Get the agent creator
    SELECT creator_id INTO v_creator_id FROM public.agents WHERE id = NEW.agent_id;

    -- Credit the user's USDC wallet
    IF v_creator_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance + NEW.earnings,
          updated_at = now()
      WHERE user_id = v_creator_id AND currency = 'USDC';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
