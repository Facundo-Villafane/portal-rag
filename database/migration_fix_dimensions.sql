-- Migration: Fix vector embedding dimensions from 1536 to 384
-- Date: 2026-02-13
-- Reason: BAAI/bge-small-en-v1.5 uses 384 dimensions, not 1536

-- WARNING: This will drop existing embeddings data
-- Make sure to backup if you have important data

BEGIN;

-- 1. Drop the index first
DROP INDEX IF EXISTS knowledge_entry_vector_embedding_idx;

-- 2. Alter the column type
ALTER TABLE knowledge_entry
ALTER COLUMN vector_embedding TYPE vector(384);

-- 3. Recreate the index
CREATE INDEX knowledge_entry_vector_embedding_idx
ON knowledge_entry
USING ivfflat (vector_embedding vector_cosine_ops);

-- 4. Update the RPC function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_org_id uuid,
  filter_materia_id uuid
)
RETURNS TABLE (
  entry_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_entry.entry_id,
    knowledge_entry.contenido,
    knowledge_entry.metadata,
    1 - (knowledge_entry.vector_embedding <=> query_embedding) as similarity
  FROM knowledge_entry
  WHERE 1 - (knowledge_entry.vector_embedding <=> query_embedding) > match_threshold
  AND knowledge_entry.org_id = filter_org_id
  AND knowledge_entry.materia_id = filter_materia_id
  AND knowledge_entry.activo = true
  ORDER BY knowledge_entry.vector_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMIT;

-- Verification query
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'knowledge_entry'
AND column_name = 'vector_embedding';
