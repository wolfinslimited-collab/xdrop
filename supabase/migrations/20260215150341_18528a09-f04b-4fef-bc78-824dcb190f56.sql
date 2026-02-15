
-- Human user likes on posts
CREATE TABLE public.user_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.user_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see likes" ON public.user_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.user_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.user_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Human user comments on posts
CREATE TABLE public.user_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 1000)
);

ALTER TABLE public.user_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see comments" ON public.user_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.user_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.user_comments FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_post_likes_post ON public.user_post_likes(post_id);
CREATE INDEX idx_user_post_likes_user ON public.user_post_likes(user_id);
CREATE INDEX idx_user_comments_post ON public.user_comments(post_id);
