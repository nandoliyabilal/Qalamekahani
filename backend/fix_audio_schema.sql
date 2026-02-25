-- 1. Add price and discount columns if they don't exist
ALTER TABLE audio_stories
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- 2. Force PostgREST to refresh its schema cache
-- This is often needed in Supabase after a schema change so the API "sees" the new columns.
NOTIFY pgrst, 'reload schema';
