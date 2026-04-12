CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_context VARCHAR(100),
    query TEXT NOT NULL,
    response_summary TEXT,
    retrieved_doc_ids UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user ON user_interactions(user_id, created_at DESC);
