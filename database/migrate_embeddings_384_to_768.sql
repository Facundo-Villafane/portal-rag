-- Migration: vector_embedding 384 → 768 dims (fastembed BGE-small → Groq nomic-embed-text-v1.5)
--
-- IMPORTANTE: Esta migración elimina todos los embeddings existentes.
-- Después de correrla, re-indexar los documentos desde el Knowledge Manager.
--
-- Correr en Supabase SQL Editor.

-- 1. Drop the existing IVFFlat index (required before altering column type)
drop index if exists knowledge_entry_vector_embedding_idx;

-- 2. Alter the column dimension (384 → 768)
--    pgvector permite ALTER COLUMN TYPE si no hay índice activo
alter table knowledge_entry
    alter column vector_embedding type vector(768)
    using null;  -- existing 384-dim vectors are incompatible — set to null so re-ingestion is required

-- 3. Recreate the IVFFlat index for cosine similarity search
--    lists=100 is a good default for tables up to ~1M rows
create index knowledge_entry_vector_embedding_idx
    on knowledge_entry
    using ivfflat (vector_embedding vector_cosine_ops)
    with (lists = 100);

-- 4. Verify
select
    count(*) as total_entries,
    count(vector_embedding) as entries_with_embedding,
    count(*) - count(vector_embedding) as entries_pending_reindex
from knowledge_entry;
