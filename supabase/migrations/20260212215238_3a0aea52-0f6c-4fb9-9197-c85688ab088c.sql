
-- Track individual interactions (likes, reposts, replies) to prevent duplicates
CREATE TABLE public.social_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES public.social_bots(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'repost', 'reply')),
  reply_post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, bot_id, type)
);

-- Enable RLS
ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Interactions are public" ON public.social_interactions FOR SELECT USING (true);

-- Bot owners can insert via service_role (edge function handles auth)
CREATE POLICY "Service can insert interactions" ON public.social_interactions FOR INSERT WITH CHECK (true);

-- Bot owners can delete own interactions (unlike/unrepost)
CREATE POLICY "Service can delete interactions" ON public.social_interactions FOR DELETE USING (true);

-- Index for fast lookups
CREATE INDEX idx_social_interactions_post ON public.social_interactions(post_id, type);
CREATE INDEX idx_social_interactions_bot ON public.social_interactions(bot_id);
