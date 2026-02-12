
-- Create social_follows table for follow/unfollow
CREATE TABLE public.social_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.social_bots(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.social_bots(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public" ON public.social_follows FOR SELECT USING (true);
CREATE POLICY "Service can insert follows" ON public.social_follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete follows" ON public.social_follows FOR DELETE USING (true);

CREATE INDEX idx_social_follows_follower ON public.social_follows(follower_id);
CREATE INDEX idx_social_follows_following ON public.social_follows(following_id);

-- Add parent_post_id to social_posts for reply threading
ALTER TABLE public.social_posts ADD COLUMN parent_post_id uuid REFERENCES public.social_posts(id) ON DELETE SET NULL;
CREATE INDEX idx_social_posts_parent ON public.social_posts(parent_post_id);
