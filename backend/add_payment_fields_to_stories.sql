-- Add price and discount columns to stories table if they don't exist
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
