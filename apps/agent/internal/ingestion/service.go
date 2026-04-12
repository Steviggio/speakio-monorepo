package ingestion

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	pgvector "github.com/pgvector/pgvector-go"
	"github.com/steviggio/speakio-agent/internal/embedding"
)

// Service orchestrates the full ingestion pipeline:
// Fetch → Clean → Markdown → Chunk → Enrich → Embed → Persist.
type Service struct {
	fetcher   *Fetcher
	cleaner   *Cleaner
	markdown  *MarkdownConverter
	chunker   *Chunker
	enricher  *Enricher
	dedup     *Dedup
	embedder  *embedding.Client
	pool      *pgxpool.Pool
	embModel  string
	logger    *slog.Logger
}

// NewService creates an ingestion service.
func NewService(
	fetcher *Fetcher,
	cleaner *Cleaner,
	markdown *MarkdownConverter,
	chunker *Chunker,
	enricher *Enricher,
	dedup *Dedup,
	embedder *embedding.Client,
	pool *pgxpool.Pool,
	embModel string,
	logger *slog.Logger,
) *Service {
	return &Service{
		fetcher:  fetcher,
		cleaner:  cleaner,
		markdown: markdown,
		chunker:  chunker,
		enricher: enricher,
		dedup:    dedup,
		embedder: embedder,
		pool:     pool,
		embModel: embModel,
		logger:   logger,
	}
}

// IngestURL processes a single URL through the full pipeline.
func (s *Service) IngestURL(ctx context.Context, rawURL, language string) error {
	start := time.Now()
	s.logger.Info("ingestion: starting", "url", rawURL)

	// 1. Fetch.
	result, err := s.fetcher.Fetch(ctx, rawURL)
	if err != nil {
		return fmt.Errorf("ingestion: fetch: %w", err)
	}

	// 2. Deduplicate by checksum.
	checksum := s.dedup.Checksum(result.HTML)
	var existingCount int
	err = s.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM sources WHERE checksum = $1`, checksum).Scan(&existingCount)
	if err == nil && existingCount > 0 {
		s.logger.Info("ingestion: duplicate content, skipping", "url", rawURL)
		return nil
	}

	// 3. Clean HTML.
	cleanHTML, err := s.cleaner.CleanHTML(result.HTML)
	if err != nil {
		return fmt.Errorf("ingestion: clean: %w", err)
	}

	// 4. Convert to Markdown.
	md, err := s.markdown.ToMarkdown(cleanHTML)
	if err != nil {
		return fmt.Errorf("ingestion: markdown: %w", err)
	}

	// 5. Chunk.
	chunks := s.chunker.Split(md)
	if len(chunks) == 0 {
		s.logger.Warn("ingestion: no chunks produced", "url", rawURL)
		return nil
	}

	// 6. Enrich.
	if language == "" {
		language = "unknown"
	}
	enriched := s.enricher.Enrich(chunks, language)

	// 7. Embed.
	texts := make([]string, len(enriched))
	for i, ec := range enriched {
		texts[i] = ec.Text
	}

	vectors, err := s.embedder.EmbedTexts(ctx, texts)
	if err != nil {
		return fmt.Errorf("ingestion: embed: %w", err)
	}

	// 8. Persist source + document + chunks.
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("ingestion: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	sourceID := uuid.New()
	now := time.Now()
	_, err = tx.Exec(ctx,
		`INSERT INTO sources (id, source_type, url, domain, language, checksum, last_crawled_at, created_at)
		 VALUES ($1, 'web', $2, $3, $4, $5, $6, $6)
		 ON CONFLICT (url) DO UPDATE SET checksum = $5, last_crawled_at = $6`,
		sourceID, rawURL, result.Domain, language, checksum, now)
	if err != nil {
		return fmt.Errorf("ingestion: upsert source: %w", err)
	}

	docID := uuid.New()
	_, err = tx.Exec(ctx,
		`INSERT INTO documents (id, source_id, canonical_url, language, content_markdown, content_text, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7)`,
		docID, sourceID, rawURL, language, md, md, now)
	if err != nil {
		return fmt.Errorf("ingestion: insert document: %w", err)
	}

	for i, ec := range enriched {
		var vec []float32
		if i < len(vectors) {
			vec = vectors[i]
		}

		metaJSON, _ := json.Marshal(map[string]string{
			"language": ec.Language,
		})

		_, err = tx.Exec(ctx,
			`INSERT INTO document_chunks
			 (id, document_id, chunk_index, heading_path, chunk_text, token_estimate,
			  category, topic, cefr_level, difficulty_score, keywords,
			  metadata_json, embedding_model, embedding, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
			uuid.New(), docID, ec.Index, ec.HeadingPath, ec.Text, ec.TokenEst,
			ec.Category, ec.Topic, ec.CEFRLevel, ec.DifficultyScore, ec.Keywords,
			metaJSON, s.embModel, pgvector.NewVector(vec), now,
		)
		if err != nil {
			return fmt.Errorf("ingestion: insert chunk %d: %w", i, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("ingestion: commit: %w", err)
	}

	s.logger.Info("ingestion: completed",
		"url", rawURL,
		"chunks", len(enriched),
		"duration_ms", time.Since(start).Milliseconds(),
	)

	return nil
}
