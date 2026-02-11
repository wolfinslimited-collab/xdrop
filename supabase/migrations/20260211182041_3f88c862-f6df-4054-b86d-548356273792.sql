-- Add template_id to agents so we can track which template was purchased
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS template_id text;

-- Add simulated_earnings tracking columns
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS monthly_return_min numeric DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS monthly_return_max numeric DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS purchased_at timestamp with time zone;