-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- Organizations
create table organization (
  org_id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  config_global jsonb default '{}'::jsonb,
  llm_provider_default text,
  llm_credentials_encrypted text,
  llm_key_last4 varchar(4),
  llm_credentials_updated_at timestamptz,
  created_at timestamptz default now()
);

-- App Users (complementary to Supabase Auth)
create table app_user (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organization(org_id) on delete cascade,
  rol text check (rol in ('superadmin','admin','profesor')) not null,
  created_at timestamptz default now()
);

-- Carrera
create table carrera (
  carrera_id uuid primary key default uuid_generate_v4(),
  org_id uuid references organization(org_id) on delete cascade,
  nombre text not null,
  contexto_global text,
  created_at timestamptz default now()
);

-- Materia
create table materia (
  materia_id uuid primary key default uuid_generate_v4(),
  org_id uuid references organization(org_id) on delete cascade,
  carrera_id uuid references carrera(carrera_id) on delete cascade,
  profesor_id uuid references app_user(user_id),
  nombre text not null,
  modelo_seleccionado text,
  config_bot jsonb default '{}'::jsonb,
  retriever_config jsonb default '{}'::jsonb,
  custom_prompt text,
  created_at timestamptz default now()
);

-- Knowledge Entry (RAG)
create table knowledge_entry (
  entry_id uuid primary key default uuid_generate_v4(),
  org_id uuid references organization(org_id) on delete cascade,
  materia_id uuid references materia(materia_id) on delete cascade,
  titulo text,
  contenido text not null,
  metadata jsonb default '{}'::jsonb,
  vector_embedding vector(384), -- BAAI/bge-small-en-v1.5 dimension
  tokens_estimados integer,
  version integer default 1,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Index for vector search
create index on knowledge_entry using ivfflat (vector_embedding vector_cosine_ops);

-- Chat Session
create table chat_session (
  session_id uuid primary key default uuid_generate_v4(),
  org_id uuid references organization(org_id) on delete cascade,
  materia_id uuid references materia(materia_id) on delete cascade,
  alumno_id text, -- Identifier for student (could be ephemeral or session based)
  modelo_utilizado text,
  tokens_input integer,
  tokens_output integer,
  costo_estimado numeric(10,6),
  created_at timestamptz default now()
);

-- RLS Policies
alter table organization enable row level security;
alter table app_user enable row level security;
alter table carrera enable row level security;
alter table materia enable row level security;
alter table knowledge_entry enable row level security;
alter table chat_session enable row level security;

-- Helper function to get current user's org_id
create or replace function get_current_org_id()
returns uuid
language sql stable
as $$
  select org_id from app_user where user_id = auth.uid();
$$;

-- Policies (Basic Examples - need refinement based on exact auth flow)

-- Organization: Users can view their own organization
create policy "Users can view their own organization"
on organization for select
using (org_id = get_current_org_id());

-- App User: Users can view members of their own organization
create policy "Users can view members of their own organization"
on app_user for select
using (org_id = get_current_org_id());

-- Carrera: Users can view/edit carreras in their organization
create policy "Users can view carreras in their organization"
on carrera for select
using (org_id = get_current_org_id());

create policy "Admins can insert carreras in their organization"
on carrera for insert
with check (org_id = get_current_org_id() and exists (select 1 from app_user where user_id = auth.uid() and rol in ('superadmin', 'admin')));

-- Materia: Similar to Carrera
create policy "Users can view materias in their organization"
on materia for select
using (org_id = get_current_org_id());

create policy "Admins/Professors can insert materias"
on materia for insert
with check (org_id = get_current_org_id() and exists (select 1 from app_user where user_id = auth.uid() and rol in ('superadmin', 'admin', 'profesor')));

-- Knowledge Entry:
create policy "Users can view knowledge entries in their organization"
on knowledge_entry for select
using (org_id = get_current_org_id());

create policy "Professors can insert knowledge entries"
on knowledge_entry for insert
with check (org_id = get_current_org_id() and exists (select 1 from app_user where user_id = auth.uid() and rol in ('superadmin', 'admin', 'profesor')));

-- Chat Session:
create policy "Users can view chat sessions in their organization"
on chat_session for select
using (org_id = get_current_org_id());

create policy "Anyone can insert chat sessions (students)"
on chat_session for insert
with check (true); -- Needs stricter check for students, maybe based on materia_id validity

