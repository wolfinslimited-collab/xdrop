
-- Create game_bets table for USDC wagering on agent battles
CREATE TABLE public.game_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id),
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending',
  payout NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_bets ENABLE ROW LEVEL SECURITY;

-- Users can view all bets in a room (public for transparency)
CREATE POLICY "Anyone can view bets"
ON public.game_bets FOR SELECT
USING (true);

-- Users can place bets on their own behalf
CREATE POLICY "Users can place bets"
ON public.game_bets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can see their own bets updated (system updates status/payout)
CREATE POLICY "Users can update own bets"
ON public.game_bets FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for game_bets
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_bets;
