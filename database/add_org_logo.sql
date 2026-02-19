-- Add logo_url column to organization table
alter table organization add column if not exists logo_url text;

-- Permite al superadmin insertar organizaciones
create policy "Superadmin can insert organizations"
on organization for insert
to authenticated
with check (
  exists (
    select 1 from app_user
    where user_id = auth.uid()
    and rol = 'superadmin'
  )
);

-- Permite al superadmin ver todas las organizaciones (reemplaza la policy original)
drop policy if exists "Users can view their own organization" on organization;

create policy "Users can view their own organization"
on organization for select
using (
  org_id = (select org_id from app_user where user_id = auth.uid())
  or exists (
    select 1 from app_user
    where user_id = auth.uid()
    and rol = 'superadmin'
  )
);

-- Permite al superadmin actualizar organizaciones
create policy "Superadmin can update organizations"
on organization for update
to authenticated
using (
  exists (
    select 1 from app_user
    where user_id = auth.uid()
    and rol = 'superadmin'
  )
);
