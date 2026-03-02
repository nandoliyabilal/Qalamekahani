-- 1. Create Tables (Safe to run if not exists)

-- USERS
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  password text not null,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- CATEGORIES
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- BLOGS
create table if not exists public.blogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  content text,
  image text,
  author text,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- STORIES
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,
  image text,
  category text,
  summary text,
  description text,
  content text,
  hashtags text[],
  author text,
  views integer default 0,
  likes integer default 0,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- AUDIO STORIES
create table if not exists public.audio_stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image text,
  file_url text,
  category text,
  duration text,
  author text,
  views integer default 0,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- BOOKS
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image text,
  file_url text,
  author text,
  category text,
  original_price numeric,
  discounted_price numeric,
  rating numeric default 0,
  stock integer default 0,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- REVIEWS
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- references public.users(id),
  user_name text,
  item_id text,
  item_type text,
  rating integer,
  comment text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- SETTINGS
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  site_name text default 'Qalamekahani',
  maintenance_mode boolean default false,
  contact_email text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ANALYTICS
create table if not exists public.analytics (
  id uuid default gen_random_uuid() primary key,
  page text,
  visits integer default 0,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);


-- 2. Enable RLS on all tables (Safe to run multiple times)
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.stories enable row level security;
alter table public.books enable row level security;
alter table public.audio_stories enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.analytics enable row level security;
alter table public.blogs enable row level security;


-- 3. DROP EXISTING POLICIES (To avoid conflicts if you re-run)
drop policy if exists "Enable insert for all users" on "public"."users";
drop policy if exists "Enable read access for all users" on "public"."users";

drop policy if exists "Enable read access for all categories" on "public"."categories";
drop policy if exists "Enable insert for all categories" on "public"."categories";

drop policy if exists "Enable read access for all blogs" on "public"."blogs";
drop policy if exists "Enable insert for all blogs" on "public"."blogs";
drop policy if exists "Enable update for all blogs" on "public"."blogs";
drop policy if exists "Enable delete for all blogs" on "public"."blogs";

drop policy if exists "Enable read access for all stories" on "public"."stories";
drop policy if exists "Enable insert for all stories" on "public"."stories";
drop policy if exists "Enable update for all stories" on "public"."stories";
drop policy if exists "Enable delete for all stories" on "public"."stories";

drop policy if exists "Enable read access for all books" on "public"."books";
drop policy if exists "Enable insert for all books" on "public"."books";
drop policy if exists "Enable update for all books" on "public"."books";
drop policy if exists "Enable delete for all books" on "public"."books";

drop policy if exists "Enable read access for all audio" on "public"."audio_stories";
drop policy if exists "Enable insert for all audio" on "public"."audio_stories";
drop policy if exists "Enable update for all audio" on "public"."audio_stories";
drop policy if exists "Enable delete for all audio" on "public"."audio_stories";

drop policy if exists "Enable read access for all reviews" on "public"."reviews";
drop policy if exists "Enable insert for all reviews" on "public"."reviews";
drop policy if exists "Enable update for all reviews" on "public"."reviews";

drop policy if exists "Enable read access for all settings" on "public"."settings";
drop policy if exists "Enable insert for all settings" on "public"."settings";
drop policy if exists "Enable update for all settings" on "public"."settings";

drop policy if exists "Enable read access for all analytics" on "public"."analytics";
drop policy if exists "Enable insert for all analytics" on "public"."analytics";
drop policy if exists "Enable update for all analytics" on "public"."analytics";


-- 4. CREATE POLICIES

-- USERS
create policy "Enable insert for all users" on "public"."users" for insert with check (true);
create policy "Enable read access for all users" on "public"."users" for select using (true);

-- CATEGORIES
create policy "Enable read access for all categories" on "public"."categories" for select using (true);
create policy "Enable insert for all categories" on "public"."categories" for insert with check (true);

-- BLOGS
create policy "Enable read access for all blogs" on "public"."blogs" for select using (true);
create policy "Enable insert for all blogs" on "public"."blogs" for insert with check (true);
create policy "Enable update for all blogs" on "public"."blogs" for update using (true);
create policy "Enable delete for all blogs" on "public"."blogs" for delete using (true);

-- STORIES
create policy "Enable read access for all stories" on "public"."stories" for select using (true);
create policy "Enable insert for all stories" on "public"."stories" for insert with check (true);
create policy "Enable update for all stories" on "public"."stories" for update using (true);
create policy "Enable delete for all stories" on "public"."stories" for delete using (true);

-- BOOKS
create policy "Enable read access for all books" on "public"."books" for select using (true);
create policy "Enable insert for all books" on "public"."books" for insert with check (true);
create policy "Enable update for all books" on "public"."books" for update using (true);
create policy "Enable delete for all books" on "public"."books" for delete using (true);

-- AUDIO
create policy "Enable read access for all audio" on "public"."audio_stories" for select using (true);
create policy "Enable insert for all audio" on "public"."audio_stories" for insert with check (true);
create policy "Enable update for all audio" on "public"."audio_stories" for update using (true);
create policy "Enable delete for all audio" on "public"."audio_stories" for delete using (true);

-- REVIEWS
create policy "Enable read access for all reviews" on "public"."reviews" for select using (true);
create policy "Enable insert for all reviews" on "public"."reviews" for insert with check (true);
create policy "Enable update for all reviews" on "public"."reviews" for update using (true);

-- SETTINGS
create policy "Enable read access for all settings" on "public"."settings" for select using (true);
create policy "Enable insert for all settings" on "public"."settings" for insert with check (true);
create policy "Enable update for all settings" on "public"."settings" for update using (true);

-- ANALYTICS
create policy "Enable read access for all analytics" on "public"."analytics" for select using (true);
create policy "Enable insert for all analytics" on "public"."analytics" for insert with check (true);
create policy "Enable update for all analytics" on "public"."analytics" for update using (true);
