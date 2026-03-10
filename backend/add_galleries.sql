-- Run these queries in the Supabase SQL Editor to create the Galleries table and update the Users table.

-- 1. Galleries Table
create table if not exists public.galleries (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image text not null,
  category text,
  downloads integer default 0,
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Add saved_images to users table
alter table public.users add column if not exists saved_images text[] default '{}';

-- 3. Enable RLS and setup policies
alter table public.galleries enable row level security;
create policy "Public Read Galleries" on public.galleries for select using (true);
-- Allow authenticated insert/update/delete? In standard schema admin handles it but public can read.
