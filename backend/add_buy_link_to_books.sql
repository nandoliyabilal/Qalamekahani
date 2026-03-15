-- Add buy_link column to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS buy_link TEXT;
