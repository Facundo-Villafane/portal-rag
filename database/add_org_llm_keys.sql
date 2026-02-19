-- Migration: Add org_llm_key table for multi-key pool management
-- Run in Supabase SQL editor
-- Zero-downtime: the legacy organization.llm_credentials_encrypted column is preserved as fallback

create table if not exists org_llm_key (
  key_id        uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organization(org_id) on delete cascade,
  provider      text not null check (provider in ('groq', 'openai', 'anthropic')),
  label         text not null,
  encrypted_key text not null,
  key_last4     varchar(4) not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint uq_org_llm_key_label unique (org_id, label)
);

-- Auto-update updated_at on any row change
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_org_llm_key_updated_at
  before update on org_llm_key
  for each row execute procedure update_updated_at_column();

-- Index for fast pool lookup in getModel()
create index if not exists idx_org_llm_key_active
  on org_llm_key (org_id, provider, is_active);

-- RLS
alter table org_llm_key enable row level security;

-- Admin of own org OR superadmin can view keys (encrypted_key is NEVER selected in the UI query)
create policy "Admins can view own org keys"
  on org_llm_key for select
  using (
    exists (
      select 1 from app_user
      where user_id = auth.uid()
        and (
          rol = 'superadmin'
          or (rol = 'admin' and org_id = org_llm_key.org_id)
        )
    )
  );

create policy "Admins can insert keys for own org"
  on org_llm_key for insert
  with check (
    exists (
      select 1 from app_user
      where user_id = auth.uid()
        and (
          rol = 'superadmin'
          or (rol = 'admin' and org_id = org_llm_key.org_id)
        )
    )
  );

create policy "Admins can update keys for own org"
  on org_llm_key for update
  using (
    exists (
      select 1 from app_user
      where user_id = auth.uid()
        and (
          rol = 'superadmin'
          or (rol = 'admin' and org_id = org_llm_key.org_id)
        )
    )
  );

create policy "Admins can delete keys for own org"
  on org_llm_key for delete
  using (
    exists (
      select 1 from app_user
      where user_id = auth.uid()
        and (
          rol = 'superadmin'
          or (rol = 'admin' and org_id = org_llm_key.org_id)
        )
    )
  );
