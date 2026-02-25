-- Add story_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES public.stories(id);
