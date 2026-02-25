-- Add audio_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS audio_id UUID REFERENCES audio_stories(id);
