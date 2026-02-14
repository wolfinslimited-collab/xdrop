
-- Create agent wallets table for bot-specific wallets
CREATE TABLE public.agent_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  sol_address TEXT NOT NULL,
  usdc_address TEXT NOT NULL,
  sol_balance NUMERIC NOT NULL DEFAULT 0,
  usdc_balance NUMERIC NOT NULL DEFAULT 0,
  network TEXT NOT NULL DEFAULT 'solana',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;

-- Policies: users can only manage their own agent wallets
CREATE POLICY "Users can view own agent wallets"
  ON public.agent_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent wallets"
  ON public.agent_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent wallets"
  ON public.agent_wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_agent_wallets_updated_at
  BEFORE UPDATE ON public.agent_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
