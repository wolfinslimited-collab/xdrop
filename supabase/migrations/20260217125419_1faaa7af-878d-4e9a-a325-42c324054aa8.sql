
-- Add derivation_index to wallets table
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS derivation_index integer;

-- Add derivation_index to agent_wallets table
ALTER TABLE public.agent_wallets ADD COLUMN IF NOT EXISTS derivation_index integer;

-- Create a sequence/counter table for derivation indexes per chain
CREATE TABLE IF NOT EXISTS public.wallet_derivation_counters (
  chain text PRIMARY KEY,
  next_index integer NOT NULL DEFAULT 1
);

-- Seed initial counters for Solana
INSERT INTO public.wallet_derivation_counters (chain, next_index) 
VALUES ('SOL', 1)
ON CONFLICT (chain) DO NOTHING;

-- Enable RLS
ALTER TABLE public.wallet_derivation_counters ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role only" ON public.wallet_derivation_counters
FOR ALL USING (false);

-- Function to get and increment derivation index atomically
CREATE OR REPLACE FUNCTION public.next_derivation_index(p_chain text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_index integer;
BEGIN
  UPDATE public.wallet_derivation_counters
  SET next_index = next_index + 1
  WHERE chain = p_chain
  RETURNING next_index - 1 INTO current_index;
  
  IF current_index IS NULL THEN
    INSERT INTO public.wallet_derivation_counters (chain, next_index)
    VALUES (p_chain, 2)
    RETURNING 1 INTO current_index;
  END IF;
  
  RETURN current_index;
END;
$$;
