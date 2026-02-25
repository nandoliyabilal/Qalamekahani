-- Add description column to audio_stories table if it doesn't exist
ALTER TABLE audio_stories
ADD COLUMN IF NOT EXISTS description TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
