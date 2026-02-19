-- Update RLS Policies to allow Super Admins to view/edit everything regardless of org_id

-- Helper function to check if user is superadmin
create or replace function is_superadmin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from app_user 
    where user_id = auth.uid() 
    and rol = 'superadmin'
  );
$$;

-- ORGANIZATION
drop policy if exists "Users can view their own organization" on organization;
create policy "Users can view their own organization OR Superadmin"
on organization for select
using (org_id = get_current_org_id() OR is_superadmin());

-- CARRERA
drop policy if exists "Users can view carreras in their organization" on carrera;
create policy "Users can view carreras in their organization OR Superadmin"
on carrera for select
using (org_id = get_current_org_id() OR is_superadmin());

drop policy if exists "Admins can insert carreras in their organization" on carrera;
create policy "Admins can insert carreras"
on carrera for insert
with check ((org_id = get_current_org_id() AND exists (select 1 from app_user where user_id = auth.uid() and rol = 'admin')) OR is_superadmin());

drop policy if exists "Admins can delete carreras" on carrera;
create policy "Admins can delete carreras"
on carrera for delete
using ((org_id = get_current_org_id() AND exists (select 1 from app_user where user_id = auth.uid() and rol = 'admin')) OR is_superadmin());

-- MATERIA
drop policy if exists "Users can view materias in their organization" on materia;
create policy "Users can view materias in their organization OR Superadmin"
on materia for select
using (org_id = get_current_org_id() OR is_superadmin());

drop policy if exists "Admins/Professors can insert materias" on materia;
create policy "Admins/Professors can insert materias"
on materia for insert
with check ((org_id = get_current_org_id() AND exists (select 1 from app_user where user_id = auth.uid() and rol in ('admin', 'profesor'))) OR is_superadmin());

drop policy if exists "Admins/Professors can delete materias" on materia;
create policy "Admins/Professors can delete materias"
on materia for delete
using ((org_id = get_current_org_id() AND exists (select 1 from app_user where user_id = auth.uid() and rol in ('admin', 'profesor'))) OR is_superadmin());

-- APP_USER
drop policy if exists "Users can view members of their own organization" on app_user;
create policy "Users can view members of their own organization OR Superadmin"
on app_user for select
using (org_id = get_current_org_id() OR is_superadmin());

-- KNOWLEDGE ENTRY
drop policy if exists "Users can view knowledge entries in their organization" on knowledge_entry;
create policy "Users can view knowledge entries OR Superadmin"
on knowledge_entry for select
using (org_id = get_current_org_id() OR is_superadmin());

drop policy if exists "Professors can insert knowledge entries" on knowledge_entry;
create policy "Professors can insert knowledge entries"
on knowledge_entry for insert
with check ((org_id = get_current_org_id() AND exists (select 1 from app_user where user_id = auth.uid() and rol in ('admin', 'profesor'))) OR is_superadmin());

-- CHAT SESSION
drop policy if exists "Users can view chat sessions in their organization" on chat_session;
create policy "Users can view chat sessions OR Superadmin"
on chat_session for select
using (org_id = get_current_org_id() OR is_superadmin());
