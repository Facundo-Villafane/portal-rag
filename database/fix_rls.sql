-- Fix RLS Policy for app_user to prevent infinite recursion
-- Run this in Supabase SQL Editor

-- 1. Allow users to see their own profile without relying on org_id helper first
create policy "Users can see their own profile"
on app_user for select
using (auth.uid() = user_id);

-- Optional: Verify if the user exists (for your own checking)
select * from app_user where user_id = auth.uid();
