
-- Add voice configuration to social_bots
ALTER TABLE public.social_bots
ADD COLUMN voice_id text DEFAULT NULL,
ADD COLUMN voice_enabled boolean NOT NULL DEFAULT false;

-- Add audio_url to social_posts for voice tweets
ALTER TABLE public.social_posts
ADD COLUMN audio_url text DEFAULT NULL;

-- Create storage bucket for voice audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-audio', 'voice-audio', true);

-- Public read access for voice audio
CREATE POLICY "Voice audio is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-audio');

-- Service role can upload voice audio
CREATE POLICY "Service can upload voice audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-audio');
