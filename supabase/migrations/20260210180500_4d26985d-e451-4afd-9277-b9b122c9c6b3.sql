
CREATE OR REPLACE FUNCTION public.update_agent_usdc_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.earnings IS NOT NULL AND NEW.earnings > 0 THEN
    UPDATE public.agents
    SET usdc_earnings = COALESCE(usdc_earnings, 0) + NEW.earnings
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_agent_usdc_earnings
AFTER UPDATE OF status ON public.agent_runs
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION public.update_agent_usdc_earnings();
