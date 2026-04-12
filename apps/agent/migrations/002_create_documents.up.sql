CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(20) NOT NULL DEFAULT 'web',
    url TEXT UNIQUE,
    domain VARCHAR(255),
    title TEXT,
    language VARCHAR(10),
    license VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_crawled_at TIMESTAMPTZ,
    checksum VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    title TEXT,
    canonical_url TEXT,
    language VARCHAR(10),
    content_markdown TEXT,
    content_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_url ON sources(url);
CREATE INDEX idx_sources_checksum ON sources(checksum);
CREATE INDEX idx_documents_source ON documents(source_id);
CREATE INDEX idx_documents_language ON documents(language);
