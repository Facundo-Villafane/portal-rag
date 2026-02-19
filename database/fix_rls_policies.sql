-- Fix RLS policies to prevent recursion
-- Issue: get_current_org_id() causes stack overflow

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organization;
DROP POLICY IF EXISTS "Users can view members of their own organization" ON app_user;
DROP POLICY IF EXISTS "Users can view carreras in their organization" ON carrera;
DROP POLICY IF EXISTS "Admins can insert carreras in their organization" ON carrera;
DROP POLICY IF EXISTS "Users can view materias in their organization" ON materia;
DROP POLICY IF EXISTS "Admins/Professors can insert materias" ON materia;
DROP POLICY IF EXISTS "Users can view knowledge entries in their organization" ON knowledge_entry;
DROP POLICY IF EXISTS "Professors can insert knowledge entries" ON knowledge_entry;
DROP POLICY IF EXISTS "Users can view chat sessions in their organization" ON chat_session;
DROP POLICY IF EXISTS "Anyone can insert chat sessions (students)" ON chat_session;

-- Drop problematic function
DROP FUNCTION IF EXISTS get_current_org_id();

-- Organization policies (simplified)
CREATE POLICY "Users can view their own organization"
ON organization FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = organization.org_id
  )
);

CREATE POLICY "Allow organization updates"
ON organization FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = organization.org_id
    AND app_user.rol = 'superadmin'
  )
);

-- App User policies
CREATE POLICY "Users can view app_user records"
ON app_user FOR SELECT
USING (true); -- Service role or authenticated users can read

CREATE POLICY "Service role can insert app_user"
ON app_user FOR INSERT
WITH CHECK (true); -- Only service role should insert

CREATE POLICY "Service role can update app_user"
ON app_user FOR UPDATE
USING (true);

-- Carrera policies
CREATE POLICY "Users can view carreras in their org"
ON carrera FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = carrera.org_id
  )
);

CREATE POLICY "Admins can insert carreras"
ON carrera FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = carrera.org_id
    AND app_user.rol IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Admins can update carreras"
ON carrera FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = carrera.org_id
    AND app_user.rol IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Admins can delete carreras"
ON carrera FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = carrera.org_id
    AND app_user.rol IN ('superadmin', 'admin')
  )
);

-- Materia policies
CREATE POLICY "Users can view materias in their org"
ON materia FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = materia.org_id
  )
);

CREATE POLICY "Staff can insert materias"
ON materia FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = materia.org_id
    AND app_user.rol IN ('superadmin', 'admin', 'profesor')
  )
);

CREATE POLICY "Staff can update materias"
ON materia FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = materia.org_id
    AND app_user.rol IN ('superadmin', 'admin', 'profesor')
  )
);

CREATE POLICY "Staff can delete materias"
ON materia FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = materia.org_id
    AND app_user.rol IN ('superadmin', 'admin', 'profesor')
  )
);

-- Knowledge Entry policies
CREATE POLICY "Users can view knowledge in their org"
ON knowledge_entry FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = knowledge_entry.org_id
  )
);

CREATE POLICY "Staff can insert knowledge"
ON knowledge_entry FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = knowledge_entry.org_id
    AND app_user.rol IN ('superadmin', 'admin', 'profesor')
  )
);

CREATE POLICY "Staff can update knowledge"
ON knowledge_entry FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = knowledge_entry.org_id
    AND app_user.rol IN ('superadmin', 'admin', 'profesor')
  )
);

CREATE POLICY "Staff can delete knowledge"
ON knowledge_entry FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = knowledge_entry.org_id
    AND app_user.rol IN ('superadmin', 'admin', 'profesor')
  )
);

-- Chat Session policies
CREATE POLICY "Users can view chat sessions in their org"
ON chat_session FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = chat_session.org_id
  )
);

CREATE POLICY "Anyone can insert chat sessions"
ON chat_session FOR INSERT
WITH CHECK (true); -- Students need to insert, validate via API

COMMIT;
