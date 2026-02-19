-- RPC function for vector search
create or replace function match_documents (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_org_id uuid,
  filter_materia_id uuid
)
returns table (
  entry_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_entry.entry_id,
    knowledge_entry.contenido,
    knowledge_entry.metadata,
    1 - (knowledge_entry.vector_embedding <=> query_embedding) as similarity
  from knowledge_entry
  where 1 - (knowledge_entry.vector_embedding <=> query_embedding) > match_threshold
  and knowledge_entry.org_id = filter_org_id
  and knowledge_entry.materia_id = filter_materia_id
  order by knowledge_entry.vector_embedding <=> query_embedding
  limit match_count;
end;
$$;
