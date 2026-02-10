
-- Restrict battle log inserts to room participants
DROP POLICY "System can insert logs" ON public.game_battle_logs;
CREATE POLICY "Participants can insert logs" ON public.game_battle_logs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_participants gp 
    JOIN public.game_rooms gr ON gr.id = gp.room_id 
    WHERE gr.id = room_id AND gp.user_id = auth.uid()
  )
);
