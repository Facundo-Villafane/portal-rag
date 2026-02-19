-- Migrate vector_embedding column from 768 dims (Groq/nomic) to 384 dims (HF all-MiniLM-L6-v2)
-- Run in Supabase SQL Editor BEFORE re-indexing documents.
-- WARNING: deletes all existing vector data — documents must be re-uploaded/re-indexed afterwards.

BEGIN;

-- 1. Drop existing IVFFlat index (required before altering column type)
DROP INDEX IF EXISTS knowledge_entry_embedding_idx;

-- 2. Alter column: set all existing embeddings to NULL (incompatible dims)
ALTER TABLE knowledge_entry
    ALTER COLUMN vector_embedding TYPE vector(384)
    USING NULL;

-- 3. Recreate IVFFlat index for 384-dim vectors
--    (lists = sqrt(expected_row_count); adjust if you have many rows)
CREATE INDEX knowledge_entry_embedding_idx
    ON knowledge_entry
    USING ivfflat (vector_embedding vector_cosine_ops)
    WITH (lists = 100);

COMMIT;
