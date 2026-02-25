-- Add language column to books table
alter table public.books 
add column if not exists language text default 'English';
