
-- Add credits column to profiles (default 100 for free users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 100;

-- Create credit_transactions table to track all credit movements
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive = earned/purchased, negative = spent
  balance_after integer NOT NULL,
  type text NOT NULL, -- 'signup_bonus', 'chat_message', 'agent_creation', 'purchase'
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions (deductions happen via edge function)
CREATE POLICY "Users can insert own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to deduct credits atomically
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer, p_type text, p_description text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
  new_balance integer;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF current_credits < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'credits', current_credits);
  END IF;

  new_balance := current_credits - p_amount;

  UPDATE public.profiles SET credits = new_balance WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, -p_amount, new_balance, p_type, p_description);

  RETURN jsonb_build_object('success', true, 'credits', new_balance);
END;
$$;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_description text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO new_balance;

  IF new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description, metadata)
  VALUES (p_user_id, p_amount, new_balance, p_type, p_description, p_metadata);

  RETURN jsonb_build_object('success', true, 'credits', new_balance);
END;
$$;
