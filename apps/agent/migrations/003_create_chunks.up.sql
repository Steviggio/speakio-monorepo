CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    heading_path TEXT,
    chunk_text TEXT NOT NULL,
    token_estimate INT,
    category VARCHAR(50),
    topic VARCHAR(100),
    cefr_level VARCHAR(5),
    difficulty_score FLOAT,
    keywords TEXT[],
    examples_json JSONB,
    metadata_json JSONB,
    embedding_model VARCHAR(100),
    embedding vector(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metadata indexes for filtered retrieval.
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_cefr ON document_chunks(cefr_level);
CREATE INDEX idx_chunks_topic ON document_chunks(topic);
CREATE INDEX idx_chunks_category ON document_chunks(category);

-- HNSW index for approximate nearest neighbor search.
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Full-text search support via generated tsvector column.
ALTER TABLE document_chunks ADD COLUMN tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', chunk_text)) STORED;
CREATE INDEX idx_chunks_tsv ON document_chunks USING gin(tsv);
