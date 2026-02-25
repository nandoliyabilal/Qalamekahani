-- Enable RLS on all tables (Best Practice) --
-- You probably already ran the schema, but just in case --

-- POLICIES for 'users' table --
-- 1. Allow anyone to register (INSERT)
create policy "Enable insert for all users" on "public"."users" for insert with check (true);

-- 2. Allow users to read their own data (or public for now since we have custom auth)
-- Since we do manual auth, we might need to read by email for login.
create policy "Enable read access for all users" on "public"."users" for select using (true);


-- POLICIES for 'categories' table --
create policy "Enable read access for all categories" on "public"."categories" for select using (true);
create policy "Enable insert for all categories" on "public"."categories" for insert with check (true);


-- POLICIES for 'stories' --
create policy "Enable read access for all stories" on "public"."stories" for select using (true);
create policy "Enable insert for all stories" on "public"."stories" for insert with check (true);
create policy "Enable update for all stories" on "public"."stories" for update using (true);
create policy "Enable delete for all stories" on "public"."stories" for delete using (true);

-- POLICIES for 'books' --
create policy "Enable read access for all books" on "public"."books" for select using (true);
create policy "Enable insert for all books" on "public"."books" for insert with check (true);
create policy "Enable update for all books" on "public"."books" for update using (true);
create policy "Enable delete for all books" on "public"."books" for delete using (true);


-- POLICIES for 'audio_stories' --
create policy "Enable read access for all audio" on "public"."audio_stories" for select using (true);
create policy "Enable insert for all audio" on "public"."audio_stories" for insert with check (true);
create policy "Enable update for all audio" on "public"."audio_stories" for update using (true);
create policy "Enable delete for all audio" on "public"."audio_stories" for delete using (true);


-- POLICIES for 'reviews' --
create policy "Enable read access for all reviews" on "public"."reviews" for select using (true);
create policy "Enable insert for all reviews" on "public"."reviews" for insert with check (true);
create policy "Enable update for all reviews" on "public"."reviews" for update using (true);
create policy "Enable delete for all reviews" on "public"."reviews" for delete using (true);


-- POLICIES for 'settings' --
create policy "Enable read access for all settings" on "public"."settings" for select using (true);
create policy "Enable insert for all settings" on "public"."settings" for insert with check (true);
create policy "Enable update for all settings" on "public"."settings" for update using (true);

-- POLICIES for 'analytics' --
create policy "Enable read access for all analytics" on "public"."analytics" for select using (true);
create policy "Enable insert for all analytics" on "public"."analytics" for insert with check (true);
create policy "Enable update for all analytics" on "public"."analytics" for update using (true);

-- POLICIES for 'blogs' --
create policy "Enable read access for all blogs" on "public"."blogs" for select using (true);
create policy "Enable insert for all blogs" on "public"."blogs" for insert with check (true);
create policy "Enable update for all blogs" on "public"."blogs" for update using (true);
create policy "Enable delete for all blogs" on "public"."blogs" for delete using (true);
