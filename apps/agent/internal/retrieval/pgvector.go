package retrieval

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	pgvector "github.com/pgvector/pgvector-go"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// PgvectorStore implements hybrid search (dense vector + full-text) using pgvector.
type PgvectorStore struct {
	pool *pgxpool.Pool
}

// NewPgvectorStore creates a pgvector retrieval store.
func NewPgvectorStore(pool *pgxpool.Pool) *PgvectorStore {
	return &PgvectorStore{pool: pool}
}

// DenseSearch performs cosine similarity search on the embedding column.
func (s *PgvectorStore) DenseSearch(ctx context.Context, q *models.RetrievalQuery) ([]models.RetrievalResult, error) {
	vec := pgvector.NewVector(q.Embedding)

	var conditions []string
	var args []interface{}
	argIdx := 1 // $1 is the vector

	args = append(args, vec)

	if q.Language != "" {
		argIdx++
		conditions = append(conditions, fmt.Sprintf("dc.metadata_json->>'language' = $%d::text", argIdx))
		args = append(args, q.Language)
	}

	if q.CEFRLevelMax != "" {
		levels := AllowedLevels(q.CEFRLevelMax)
		argIdx++
		conditions = append(conditions, fmt.Sprintf("dc.cefr_level = ANY($%d::varchar[])", argIdx))
		args = append(args, levels)
	}

	if q.Category != "" {
		argIdx++
		conditions = append(conditions, fmt.Sprintf("dc.category = $%d::text", argIdx))
		args = append(args, q.Category)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	limit := q.Limit
	if limit <= 0 {
		limit = 6
	}

	query := fmt.Sprintf(`
		SELECT dc.id, dc.document_id, COALESCE(d.title, ''), dc.chunk_text,
		       COALESCE(dc.topic, ''), COALESCE(dc.category, ''), COALESCE(dc.cefr_level, ''),
		       1 - (dc.embedding <=> $1) AS score,
		       COALESCE(d.canonical_url, '')
		FROM document_chunks dc
		JOIN documents d ON d.id = dc.document_id
		%s
		ORDER BY dc.embedding <=> $1
		LIMIT %d
	`, whereClause, limit)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("retrieval/pgvector: dense search: %w", err)
	}
	defer rows.Close()

	return scanResults(rows)
}

// LexicalSearch performs PostgreSQL full-text search using tsvector.
func (s *PgvectorStore) LexicalSearch(ctx context.Context, q *models.RetrievalQuery) ([]models.RetrievalResult, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	conditions = append(conditions, fmt.Sprintf("dc.tsv @@ plainto_tsquery('simple', $%d::text)", argIdx))
	args = append(args, q.Text)

	if q.Language != "" {
		argIdx++
		conditions = append(conditions, fmt.Sprintf("dc.metadata_json->>'language' = $%d::text", argIdx))
		args = append(args, q.Language)
	}

	if q.CEFRLevelMax != "" {
		levels := AllowedLevels(q.CEFRLevelMax)
		argIdx++
		conditions = append(conditions, fmt.Sprintf("dc.cefr_level = ANY($%d::varchar[])", argIdx))
		args = append(args, levels)
	}

	whereClause := strings.Join(conditions, " AND ")

	limit := q.Limit
	if limit <= 0 {
		limit = 6
	}

	query := fmt.Sprintf(`
		SELECT dc.id, dc.document_id, COALESCE(d.title, ''), dc.chunk_text,
		       COALESCE(dc.topic, ''), COALESCE(dc.category, ''), COALESCE(dc.cefr_level, ''),
		       ts_rank(dc.tsv, plainto_tsquery('simple', $1)) AS score,
		       COALESCE(d.canonical_url, '')
		FROM document_chunks dc
		JOIN documents d ON d.id = dc.document_id
		WHERE %s
		ORDER BY score DESC
		LIMIT %d
	`, whereClause, limit)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("retrieval/pgvector: lexical search: %w", err)
	}
	defer rows.Close()

	return scanResults(rows)
}

func scanResults(rows interface{ Next() bool; Scan(dest ...any) error; Err() error }) ([]models.RetrievalResult, error) {
	var results []models.RetrievalResult
	for rows.Next() {
		var r models.RetrievalResult
		if err := rows.Scan(
			&r.ChunkID, &r.DocumentID, &r.Title, &r.ChunkText,
			&r.Topic, &r.Category, &r.CEFRLevel,
			&r.Score, &r.SourceURL,
		); err != nil {
			return nil, fmt.Errorf("retrieval/pgvector: scan row: %w", err)
		}
		results = append(results, r)
	}
	return results, rows.Err()
}
