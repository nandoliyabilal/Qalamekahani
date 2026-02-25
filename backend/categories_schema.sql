-- Run this in Supabase SQL Editor if you want Categories support

create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.categories enable row level security;
create policy "Public Read Categories" on public.categories for select using (true);
