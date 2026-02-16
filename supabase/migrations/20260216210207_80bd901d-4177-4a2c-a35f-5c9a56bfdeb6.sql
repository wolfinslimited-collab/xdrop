
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own builds" ON public.builds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own builds" ON public.builds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service can update builds" ON public.builds FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.builds;
