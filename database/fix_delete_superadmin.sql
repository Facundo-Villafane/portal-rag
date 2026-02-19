-- Fix: superadmin cannot delete knowledge_entry or update materia
-- because the existing policies require app_user.org_id = row.org_id,
-- but superadmin's app_user row belongs to the platform org (different org_id).
--
-- Run this in Supabase SQL Editor.

-- ── knowledge_entry DELETE ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can delete knowledge" ON knowledge_entry;

CREATE POLICY "Staff can delete knowledge"
ON knowledge_entry FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.rol = 'superadmin'
  )
  OR
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = knowledge_entry.org_id
    AND app_user.rol IN ('admin', 'profesor')
  )
);

-- ── materia UPDATE ──────────────────────────────────────────────────────────
-- (also broken for superadmin — config saves silently failed)
DROP POLICY IF EXISTS "Staff can update materias" ON materia;

CREATE POLICY "Staff can update materias"
ON materia FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.rol = 'superadmin'
  )
  OR
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = materia.org_id
    AND app_user.rol IN ('admin', 'profesor')
  )
);

-- ── organization UPDATE ─────────────────────────────────────────────────────
-- Allow admin (not just superadmin) to update their own org's config_global
DROP POLICY IF EXISTS "Allow organization updates" ON organization;

CREATE POLICY "Allow organization updates"
ON organization FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.rol = 'superadmin'
  )
  OR
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.user_id = auth.uid()
    AND app_user.org_id = organization.org_id
    AND app_user.rol = 'admin'
  )
);
