
-- ============================================
-- XDROP Platform Database Schema (fixed order)
-- ============================================

-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_creator BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- 3. Agent categories
CREATE TABLE public.agent_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.agent_categories FOR SELECT USING (true);

INSERT INTO public.agent_categories (name, icon, description) VALUES
  ('Trading', '📈', 'Automated trading strategies with risk controls'),
  ('Freelance', '💼', 'Find clients, send proposals, and manage freelance pipeline'),
  ('Growth', '🚀', 'Marketing automation, content creation, and audience growth'),
  ('E-commerce', '🛒', 'Product research, listings, customer support, and inventory'),
  ('Research', '🔬', 'Data gathering, analysis, and report generation'),
  ('Support', '🎧', 'Customer support automation and ticket management');

-- 4. Agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category_id UUID REFERENCES public.agent_categories(id),
  price NUMERIC NOT NULL DEFAULT 100,
  subscription_price NUMERIC,
  avatar TEXT DEFAULT '🤖',
  reliability_score NUMERIC DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  required_integrations TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published agents are public" ON public.agents FOR SELECT USING (status = 'published' OR creator_id = auth.uid());
CREATE POLICY "Auth users can create agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own agents" ON public.agents FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own agents" ON public.agents FOR DELETE USING (auth.uid() = creator_id);

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_agent_creator(_agent_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agents WHERE id = _agent_id AND creator_id = auth.uid())
$$;

-- 5. Agent purchases (BEFORE manifests so the policy can reference it)
CREATE TABLE public.agent_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  price_paid NUMERIC NOT NULL,
  subscription_status TEXT DEFAULT 'one_time' CHECK (subscription_status IN ('one_time', 'active', 'cancelled', 'expired')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, agent_id)
);

ALTER TABLE public.agent_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own purchases" ON public.agent_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can purchase" ON public.agent_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_purchased_agent(_agent_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agent_purchases WHERE agent_id = _agent_id AND user_id = auth.uid())
$$;

-- 6. Agent manifests
CREATE TABLE public.agent_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  tool_permissions JSONB NOT NULL DEFAULT '[]',
  guardrails JSONB NOT NULL DEFAULT '{}',
  triggers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

ALTER TABLE public.agent_manifests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own manifests" ON public.agent_manifests FOR SELECT USING (public.is_agent_creator(agent_id));
CREATE POLICY "Purchasers can view manifests" ON public.agent_manifests FOR SELECT USING (public.has_purchased_agent(agent_id));
CREATE POLICY "Creators can insert manifests" ON public.agent_manifests FOR INSERT WITH CHECK (public.is_agent_creator(agent_id));
CREATE POLICY "Creators can update manifests" ON public.agent_manifests FOR UPDATE USING (public.is_agent_creator(agent_id));
CREATE POLICY "Creators can delete manifests" ON public.agent_manifests FOR DELETE USING (public.is_agent_creator(agent_id));

CREATE TRIGGER update_manifests_updated_at BEFORE UPDATE ON public.agent_manifests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Agent ratings
CREATE TABLE public.agent_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_id)
);

ALTER TABLE public.agent_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings are public" ON public.agent_ratings FOR SELECT USING (true);
CREATE POLICY "Purchasers can rate" ON public.agent_ratings FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_purchased_agent(agent_id));
CREATE POLICY "Users can update own rating" ON public.agent_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rating" ON public.agent_ratings FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.agent_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Agent runs
CREATE TABLE public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  earnings NUMERIC DEFAULT 0,
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  verification_tier INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own runs" ON public.agent_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create runs" ON public.agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runs" ON public.agent_runs FOR UPDATE USING (auth.uid() = user_id);

-- 9. Run cards (proof social)
CREATE TABLE public.run_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  earnings_shown NUMERIC DEFAULT 0,
  verification_tier INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.run_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public run cards visible" ON public.run_cards FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can share runs" ON public.run_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.run_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.run_cards FOR DELETE USING (auth.uid() = user_id);

-- 10. Run logs
CREATE TABLE public.run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
  log_level TEXT DEFAULT 'info' CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own run logs" ON public.run_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_logs.agent_run_id AND user_id = auth.uid())
);
CREATE POLICY "System can insert logs" ON public.run_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_logs.agent_run_id AND user_id = auth.uid())
);
