-- Add payment fields to audio stories
ALTER TABLE audio_stories
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
