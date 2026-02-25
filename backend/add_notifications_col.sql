-- Run this in Supabase SQL Editor to enable notifications for existing users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notifications_on BOOLEAN DEFAULT true;
