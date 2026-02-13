
-- Table to track free trials (one per user per template)
CREATE TABLE public.agent_trials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  template_id text NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id)
);

-- Enable RLS
ALTER TABLE public.agent_trials ENABLE ROW LEVEL SECURITY;

-- Users can view own trials
CREATE POLICY "Users can view own trials"
ON public.agent_trials FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own trials
CREATE POLICY "Users can insert own trials"
ON public.agent_trials FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own trials
CREATE POLICY "Users can update own trials"
ON public.agent_trials FOR UPDATE
USING (auth.uid() = user_id);

-- Add is_trial and trial_earnings_locked flags to agents table
ALTER TABLE public.agents ADD COLUMN is_trial boolean NOT NULL DEFAULT false;
ALTER TABLE public.agents ADD COLUMN trial_earnings_locked numeric DEFAULT 0;
