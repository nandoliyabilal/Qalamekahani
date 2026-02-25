-- Add youtube_link column to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS youtube_link text;
