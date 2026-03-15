-- Create table for multi-part audio stories
CREATE TABLE IF NOT EXISTS public.audio_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_story_id UUID REFERENCES public.audio_stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration TEXT,
  order_index INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Allow public read for episodes as well)
ALTER TABLE public.audio_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Audio Episodes" ON public.audio_episodes FOR SELECT USING (true);
