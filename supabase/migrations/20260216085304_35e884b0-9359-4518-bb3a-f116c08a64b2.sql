
-- Table to store email verification codes
CREATE TABLE public.email_verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_email_verification_email ON public.email_verification_codes (email, code);

-- Auto-cleanup old codes (no RLS needed - accessed only via edge functions with service role)
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- No public RLS policies - only service role accesses this table via edge functions
