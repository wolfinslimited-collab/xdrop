
-- Create wallets table for user USDC wallets (Solana)
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  address text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  network text NOT NULL DEFAULT 'solana',
  currency text NOT NULL DEFAULT 'USDC',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wallet
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own wallet (for balance updates via edge functions)
CREATE POLICY "Users can update own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id);

-- System insert (will be done via service role in edge function)
CREATE POLICY "Users can insert own wallet"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add usdc_earnings column to agents table for display
ALTER TABLE public.agents ADD COLUMN usdc_earnings numeric DEFAULT 0;
