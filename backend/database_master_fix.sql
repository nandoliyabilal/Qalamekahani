-- MASTER DATABASE SYNC SCRIPT
-- Run this in Supabase SQL Editor to make sure all features work.

-- 1. STORIES TABLE UPDATES
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS language text DEFAULT 'Gujarati';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS youtube_link text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS chapter_stats jsonb DEFAULT '{}'::jsonb;

-- 2. AUDIO STORIES TABLE UPDATES
ALTER TABLE public.audio_stories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.audio_stories ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.audio_stories ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE public.audio_stories ADD COLUMN IF NOT EXISTS language text DEFAULT 'Gujarati';

-- 3. BOOKS TABLE UPDATES
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS language text DEFAULT 'Gujarati';

-- 4. CREATE MISSING TABLES
CREATE TABLE IF NOT EXISTS public.audio_episodes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    audio_story_id uuid REFERENCES public.audio_stories(id) ON DELETE CASCADE,
    title text NOT NULL,
    file_url text NOT NULL,
    duration text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.blogs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    slug text UNIQUE,
    content text,
    image text,
    category text DEFAULT 'General',
    tags text[],
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name text DEFAULT 'Qalamekahani',
    story_categories text DEFAULT 'Action, Romance, Horror',
    audio_categories text DEFAULT 'Fairy Tales, Thriller',
    book_categories text DEFAULT 'Novels, Poetry',
    blog_categories text DEFAULT 'Updates, Reviews',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    user_name text,
    item_id text,
    item_type text, 
    rating integer,
    comment text,
    is_approved boolean DEFAULT true,
    status text DEFAULT 'approved',
    reply text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chapter_ratings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_index integer NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. CREATE MISSING RPCs
CREATE OR REPLACE FUNCTION public.increment_story_views(row_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.stories
  SET views = views + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_chapter_view(story_id_uuid uuid, ch_key text)
RETURNS void AS $$
BEGIN
  UPDATE public.stories
  SET chapter_stats = 
    jsonb_set(
      COALESCE(chapter_stats, '{}'::jsonb), 
      ARRAY[ch_key], 
      (COALESCE((chapter_stats->>ch_key)::int, 0) + 1)::text::jsonb
    )
  WHERE id = story_id_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ENABLE RLS AND POLICIES
ALTER TABLE public.chapter_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_episodes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read' AND tablename = 'audio_episodes') THEN
        CREATE POLICY "Public Read" ON public.audio_episodes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Ratings' AND tablename = 'chapter_ratings') THEN
        CREATE POLICY "Public Read Ratings" ON public.chapter_ratings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Ratings' AND tablename = 'chapter_ratings') THEN
        CREATE POLICY "Public Insert Ratings" ON public.chapter_ratings FOR INSERT WITH CHECK (true);
    END IF;
END $$;
