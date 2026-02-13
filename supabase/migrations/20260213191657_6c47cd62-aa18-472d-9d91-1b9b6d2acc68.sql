
-- Platform settings key-value store for admin configuration
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for maintenance mode checks, banners, etc.)
CREATE POLICY "Settings are publicly readable"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only admins can modify (enforced via edge function with service role)

-- Seed default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back soon."}'::jsonb, 'Enable/disable maintenance mode'),
  ('announcement_banner', '{"enabled": false, "message": "", "type": "info"}'::jsonb, 'Platform-wide announcement banner'),
  ('feature_flags', '{"marketplace_enabled": true, "arena_enabled": true, "builder_enabled": true, "wallet_enabled": true, "bot_chat_enabled": true}'::jsonb, 'Toggle platform features on/off'),
  ('registration', '{"enabled": true, "invite_only": false}'::jsonb, 'User registration settings');
