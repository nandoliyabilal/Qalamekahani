-- Migrate Settings to Supabase
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Stories That Touch The Soul';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Written & Narrated by Sabirkhan Pathan';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT 'images/hero.png';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '+91 98765 43210';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT 'Mumbai, India';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT '#';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT '#';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS social_youtube TEXT DEFAULT '#';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS admin_profile_image TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_heading TEXT DEFAULT 'Welcome to My World of Words';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_short TEXT DEFAULT 'Assalamualikum! I am Sabirkhan Pathan. Writing is not just my hobby, it''s my way of connecting with souls.';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_long TEXT DEFAULT 'Sabir Khan is a renowned horror fiction writer...';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_image TEXT DEFAULT 'images/author.png';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS story_categories TEXT[] DEFAULT '{"Horror", "Romance", "Mystery", "Drama", "Thriller"}';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS audio_categories TEXT[] DEFAULT '{"Audio Drama", "Single Narration", "Full Cast"}';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS book_categories TEXT[] DEFAULT '{"Fiction", "Non-Fiction", "Anthology"}';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS blog_categories TEXT[] DEFAULT '{"Updates", "Behind the Scenes", "Tips"}';

-- Insert default settings if none exist
INSERT INTO public.settings (site_name)
SELECT 'Qalamekahani'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);
