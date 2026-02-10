
-- Game rooms for multiplayer agent battles
CREATE TABLE public.game_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'waiting', -- waiting, in_progress, completed
  max_participants integer NOT NULL DEFAULT 4,
  round_number integer NOT NULL DEFAULT 0,
  total_rounds integer NOT NULL DEFAULT 5,
  winner_agent_id uuid REFERENCES public.agents(id),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Auth users can create rooms" ON public.game_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update room" ON public.game_rooms FOR UPDATE USING (auth.uid() = created_by);

-- Game participants (agents in rooms)
CREATE TABLE public.game_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id),
  user_id uuid NOT NULL,
  health integer NOT NULL DEFAULT 100,
  attack_power integer NOT NULL DEFAULT 10,
  defense integer NOT NULL DEFAULT 5,
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'alive', -- alive, eliminated
  joined_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.game_participants FOR SELECT USING (true);
CREATE POLICY "Auth users can join games" ON public.game_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update participant" ON public.game_participants FOR UPDATE USING (auth.uid() = user_id);

-- Game battle logs
CREATE TABLE public.game_battle_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  round integer NOT NULL,
  attacker_id uuid REFERENCES public.game_participants(id),
  defender_id uuid REFERENCES public.game_participants(id),
  damage integer NOT NULL DEFAULT 0,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.game_battle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view battle logs" ON public.game_battle_logs FOR SELECT USING (true);
CREATE POLICY "System can insert logs" ON public.game_battle_logs FOR INSERT WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_battle_logs;
