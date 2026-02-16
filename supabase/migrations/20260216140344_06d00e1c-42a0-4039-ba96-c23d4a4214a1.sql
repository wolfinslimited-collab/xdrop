
-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  details TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for report screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('report-screenshots', 'report-screenshots', false);

-- Users can upload screenshots to their own folder
CREATE POLICY "Users can upload report screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own screenshots
CREATE POLICY "Users can view own report screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all report screenshots
CREATE POLICY "Admins can view all report screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-screenshots' AND public.has_role(auth.uid(), 'admin'));
