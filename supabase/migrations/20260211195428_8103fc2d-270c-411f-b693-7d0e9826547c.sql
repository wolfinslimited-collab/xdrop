
-- Create agent_nfts table to track minted NFTs
CREATE TABLE public.agent_nfts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mint_address text,
  metadata_uri text,
  image_url text,
  token_name text NOT NULL,
  token_symbol text NOT NULL DEFAULT 'XCLAW',
  serial_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mint_tx_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  minted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.agent_nfts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own NFTs" ON public.agent_nfts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view NFTs by agent" ON public.agent_nfts FOR SELECT USING (true);
CREATE POLICY "Service can insert NFTs" ON public.agent_nfts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service can update NFTs" ON public.agent_nfts FOR UPDATE USING (auth.uid() = user_id);

-- Serial number sequence per agent (use a function)
CREATE OR REPLACE FUNCTION public.next_nft_serial(p_agent_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_serial integer;
BEGIN
  SELECT COALESCE(MAX(serial_number), 0) + 1 INTO next_serial FROM public.agent_nfts;
  RETURN next_serial;
END;
$$;

-- Storage bucket for NFT images
INSERT INTO storage.buckets (id, name, public) VALUES ('nft-images', 'nft-images', true);

-- Public read access for NFT images
CREATE POLICY "NFT images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'nft-images');
CREATE POLICY "Service can upload NFT images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'nft-images');
