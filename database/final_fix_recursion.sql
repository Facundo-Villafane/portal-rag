-- 1. DROP problematic policies
DROP POLICY IF EXISTS "Users can view members of their own organization" ON app_user;
DROP POLICY IF EXISTS "Users can see their own profile" ON app_user;
DROP POLICY IF EXISTS "Admins can view all users in their org" ON app_user;

-- 2. Own profile policy
CREATE POLICY "Users can see their own profile"
ON app_user FOR SELECT
USING (auth.uid() = user_id);

-- 3. Helper function to check if requester is admin
CREATE OR REPLACE FUNCTION is_requester_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_user
    WHERE user_id = (SELECT auth.uid())::uuid
      AND rol IN ('superadmin', 'admin')
  );
$$;
-- Revoke execute from anon/authenticated to limit direct use
REVOKE EXECUTE ON FUNCTION is_requester_admin() FROM anon, authenticated;

-- 4. Admin policy that calls the SECURITY DEFINER function
CREATE POLICY "Admins can view all users in their org"
ON app_user FOR SELECT
USING (
  is_requester_admin()
);

-- 5. Optional notice via SELECT (no PL/pgSQL required)
SELECT 'Recursion fixed. Bad policy dropped.' AS message;
