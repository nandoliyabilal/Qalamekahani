-- Run these queries in the Supabase SQL Editor to create your tables.

-- 1. Users Table (Custom Auth)
create table public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  password text not null, -- Will store hashed password
  role text default 'user', -- 'admin' or 'user'
  notifications_on boolean default true, -- To toggle email notifications
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Stories Table
create table public.stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,
  image text,
  category text,
  summary text,
  description text,
  content text,
  hashtags text[], -- Array of strings
  author text,
  views integer default 0,
  likes integer default 0,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Audio Stories Table
create table public.audio_stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image text,
  file_url text, -- Path to audio file
  category text,
  duration text,
  author text,
  views integer default 0,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Books Table
create table public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image text,
  file_url text, -- Path to PDF/Epub
  author text,
  category text,
  original_price numeric,
  discounted_price numeric,
  rating numeric default 0,
  stock integer default 0,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Reviews Table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  user_name text, -- Cache name to avoid joins sometimes
  item_id text, -- Can link to story, book, etc.
  item_type text, -- 'story', 'book', 'audio'
  rating integer,
  comment text,
  status text default 'pending', -- for moderation
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Settings Table
create table public.settings (
  id uuid default gen_random_uuid() primary key,
  site_name text default 'QalamVerse',
  maintenance_mode boolean default false,
  contact_email text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Analytics/Stats Table (Optional Simplified)
create table public.analytics (
  id uuid default gen_random_uuid() primary key,
  page text,
  visits integer default 0,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security) - Optional but recommended
alter table public.users enable row level security;
alter table public.stories enable row level security;
-- For now, allow public read access for simple migration
create policy "Public Read Stories" on public.stories for select using (true);
create policy "Public Read Books" on public.books for select using (true);
create policy "Public Read Audio" on public.audio_stories for select using (true);
