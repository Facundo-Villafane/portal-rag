-- ENABLE SUPER ADMIN GOD MODE
-- Run this in Supabase SQL Editor

-- 1. Update RLS Policies to allow superadmin to see EVERYTHING
-- Organization
DROP POLICY IF EXISTS "Users can view their own organization" ON organization;
CREATE POLICY "Users can view their own organization"
ON organization FOR SELECT
USING (
  org_id = get_current_org_id() 
  OR 
  exists (select 1 from app_user where user_id = auth.uid() and rol = 'superadmin')
);

-- App User
DROP POLICY IF EXISTS "Admins can view all users in their org" ON app_user;
CREATE POLICY "Admins can view all users in their org"
ON app_user FOR SELECT
USING (
  is_requester_admin() -- This checks for admin/superadmin in OWN org
  OR
  exists (select 1 from app_user where user_id = auth.uid() and rol = 'superadmin') -- Global superadmin
);

-- Carrera
DROP POLICY IF EXISTS "Users can view carreras in their organization" ON carrera;
CREATE POLICY "Users can view carreras in their organization"
ON carrera FOR SELECT
USING (
  org_id = get_current_org_id()
  OR 
  exists (select 1 from app_user where user_id = auth.uid() and rol = 'superadmin')
);

-- Materia
DROP POLICY IF EXISTS "Users can view materias in their organization" ON materia;
CREATE POLICY "Users can view materias in their organization"
ON materia FOR SELECT
USING (
  org_id = get_current_org_id()
  OR 
  exists (select 1 from app_user where user_id = auth.uid() and rol = 'superadmin')
);

-- Knowledge Entry
DROP POLICY IF EXISTS "Users can view knowledge entries in their organization" ON knowledge_entry;
CREATE POLICY "Users can view knowledge entries in their organization"
ON knowledge_entry FOR SELECT
USING (
  org_id = get_current_org_id()
  OR 
  exists (select 1 from app_user where user_id = auth.uid() and rol = 'superadmin')
);


-- 2. Update specific user to SUPERADMIN
UPDATE app_user
SET rol = 'superadmin'
WHERE user_id = '959ca072-26da-482f-a33d-9e684140a0f1'; -- Your UID

RAISE NOTICE 'Super Admin permissions updated and user promoted.';
