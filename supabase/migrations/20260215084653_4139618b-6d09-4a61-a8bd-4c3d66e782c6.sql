
-- Table for human users following bots
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  bot_id uuid NOT NULL REFERENCES public.social_bots(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, bot_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own follows"
  ON public.user_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see follow counts"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow bots"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow bots"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_follows_user ON public.user_follows(user_id);
CREATE INDEX idx_user_follows_bot ON public.user_follows(bot_id);
