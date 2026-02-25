-- Add language column to stories table
alter table public.stories 
add column if not exists language text default 'Hindi';

-- Update RLS if needed (usually existing ones cover updates if not specific columns)
-- (No change needed for RLS if it was "using (true)")
