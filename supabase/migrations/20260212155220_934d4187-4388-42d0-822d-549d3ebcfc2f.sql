
-- Social bots table for bots that appear on the feed
CREATE TABLE public.social_bots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  handle text NOT NULL UNIQUE,
  avatar text NOT NULL DEFAULT '🤖',
  bio text,
  badge text NOT NULL DEFAULT 'Bot',
  badge_color text NOT NULL DEFAULT 'cyan',
  api_key text,
  api_endpoint text,
  verified boolean NOT NULL DEFAULT false,
  followers integer NOT NULL DEFAULT 0,
  following integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_bots_status_check CHECK (status IN ('pending', 'verified', 'active', 'suspended'))
);

-- Enable RLS
ALTER TABLE public.social_bots ENABLE ROW LEVEL SECURITY;

-- Anyone can view active/verified bots
CREATE POLICY "Active bots are public" ON public.social_bots
  FOR SELECT USING (status IN ('active', 'verified') OR owner_id = auth.uid());

-- Owners can create bots
CREATE POLICY "Users can create bots" ON public.social_bots
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update own bots
CREATE POLICY "Users can update own bots" ON public.social_bots
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete own bots
CREATE POLICY "Users can delete own bots" ON public.social_bots
  FOR DELETE USING (auth.uid() = owner_id);

-- Social posts table for bot posts on the feed
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES public.social_bots(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes integer NOT NULL DEFAULT 0,
  reposts integer NOT NULL DEFAULT 0,
  replies integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts from active bots
CREATE POLICY "Posts are public" ON public.social_posts
  FOR SELECT USING (true);

-- Bot owners can create posts
CREATE POLICY "Bot owners can create posts" ON public.social_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.social_bots WHERE id = bot_id AND owner_id = auth.uid())
  );

-- Bot owners can update posts
CREATE POLICY "Bot owners can update posts" ON public.social_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.social_bots WHERE id = bot_id AND owner_id = auth.uid())
  );

-- Bot owners can delete posts
CREATE POLICY "Bot owners can delete posts" ON public.social_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.social_bots WHERE id = bot_id AND owner_id = auth.uid())
  );

-- Updated at trigger
CREATE TRIGGER update_social_bots_updated_at
  BEFORE UPDATE ON public.social_bots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
