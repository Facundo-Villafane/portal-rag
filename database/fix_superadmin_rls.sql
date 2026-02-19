-- Fix RLS policies for superadmin access across all tables
-- Uses security definer functions to avoid infinite recursion in app_user policy.

-- ============================================================
-- HELPER FUNCTIONS (security definer = bypass RLS, no recursion)
-- ============================================================
create or replace function get_current_user_role()
returns text
language sql stable security definer
as $$
  select rol from app_user where user_id = auth.uid();
$$;

create or replace function get_current_user_org()
returns uuid
language sql stable security definer
as $$
  select org_id from app_user where user_id = auth.uid();
$$;

-- ============================================================
-- ORGANIZATION
-- ============================================================
drop policy if exists "Superadmin can insert organizations" on organization;
create policy "Superadmin can insert organizations"
on organization for insert to authenticated
with check (get_current_user_role() = 'superadmin');

drop policy if exists "Users can view their own organization" on organization;
create policy "Users can view their own organization"
on organization for select
using (org_id = get_current_user_org() or get_current_user_role() = 'superadmin');

drop policy if exists "Superadmin can update organizations" on organization;
create policy "Superadmin can update organizations"
on organization for update to authenticated
using (get_current_user_role() = 'superadmin');

-- ============================================================
-- CARRERA
-- ============================================================
drop policy if exists "Admins can insert carreras in their organization" on carrera;
create policy "Admins can insert carreras in their organization"
on carrera for insert to authenticated
with check (
  get_current_user_role() = 'superadmin'
  or (org_id = get_current_user_org() and get_current_user_role() in ('admin'))
);

drop policy if exists "Users can view carreras in their organization" on carrera;
create policy "Users can view carreras in their organization"
on carrera for select
using (org_id = get_current_user_org() or get_current_user_role() = 'superadmin');

-- ============================================================
-- MATERIA
-- ============================================================
drop policy if exists "Admins/Professors can insert materias" on materia;
create policy "Admins/Professors can insert materias"
on materia for insert to authenticated
with check (
  get_current_user_role() = 'superadmin'
  or (org_id = get_current_user_org() and get_current_user_role() in ('admin', 'profesor'))
);

drop policy if exists "Users can view materias in their organization" on materia;
create policy "Users can view materias in their organization"
on materia for select
using (org_id = get_current_user_org() or get_current_user_role() = 'superadmin');

-- ============================================================
-- KNOWLEDGE ENTRY
-- ============================================================
drop policy if exists "Professors can insert knowledge entries" on knowledge_entry;
create policy "Professors can insert knowledge entries"
on knowledge_entry for insert to authenticated
with check (
  get_current_user_role() = 'superadmin'
  or (org_id = get_current_user_org() and get_current_user_role() in ('admin', 'profesor'))
);

drop policy if exists "Users can view knowledge entries in their organization" on knowledge_entry;
create policy "Users can view knowledge entries in their organization"
on knowledge_entry for select
using (org_id = get_current_user_org() or get_current_user_role() = 'superadmin');

-- ============================================================
-- APP USER
-- ============================================================
drop policy if exists "Users can view members of their own organization" on app_user;
create policy "Users can view members of their own organization"
on app_user for select
using (org_id = get_current_user_org() or get_current_user_role() = 'superadmin');
