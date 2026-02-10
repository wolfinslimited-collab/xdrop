
CREATE OR REPLACE FUNCTION public.prevent_wallet_address_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.address IS DISTINCT FROM NEW.address THEN
    RAISE EXCEPTION 'Wallet address cannot be changed once created';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_immutable_wallet_address
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.prevent_wallet_address_change();
