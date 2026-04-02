-- RUN THIS IN THE SUPABASE SQL EDITOR TO FIX CHAPTER VIEWS & RATINGS

-- 1. Add chapter_stats column to stories table (for view counts)
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS chapter_stats jsonb DEFAULT '{}'::jsonb;

-- 2. Create chapter_ratings table (for chapter-specific ratings)
CREATE TABLE IF NOT EXISTS public.chapter_ratings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_index integer NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS for chapter_ratings
ALTER TABLE public.chapter_ratings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for chapter_ratings
-- Anyone can insert a rating
CREATE POLICY "Enable insert for all chapter ratings" ON public.chapter_ratings
    FOR INSERT WITH CHECK (true);

-- Anyone can read chapter ratings
CREATE POLICY "Enable read for all chapter ratings" ON public.chapter_ratings
    FOR SELECT USING (true);
