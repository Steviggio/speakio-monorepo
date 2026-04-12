package retrieval

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/steviggio/speakio-agent/internal/embedding"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// Service orchestrates hybrid retrieval: embeds the query, runs dense + lexical
// search in parallel, and applies reranking.
type Service struct {
	store     *PgvectorStore
	embedder  *embedding.Client
	reranker  *Reranker
	logger    *slog.Logger
	maxChunks int
}

// NewService creates a retrieval service.
func NewService(store *PgvectorStore, embedder *embedding.Client, reranker *Reranker, logger *slog.Logger, maxChunks int) *Service {
	return &Service{
		store:     store,
		embedder:  embedder,
		reranker:  reranker,
		logger:    logger,
		maxChunks: maxChunks,
	}
}

// Search runs the full hybrid retrieval pipeline.
func (s *Service) Search(ctx context.Context, userCtx *models.UserContext, message string) ([]models.RetrievalResult, error) {
	query := BuildRetrievalQuery(message, userCtx, s.maxChunks*2)

	// Embed the user query for dense search.
	vec, err := s.embedder.EmbedText(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("retrieval: embed query: %w", err)
	}
	query.Embedding = vec

	// Run dense and lexical searches in parallel.
	var (
		denseResults   []models.RetrievalResult
		lexicalResults []models.RetrievalResult
		denseErr       error
		lexicalErr     error
		wg             sync.WaitGroup
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		denseResults, denseErr = s.store.DenseSearch(ctx, query)
	}()
	go func() {
		defer wg.Done()
		lexicalResults, lexicalErr = s.store.LexicalSearch(ctx, query)
	}()
	wg.Wait()

	if denseErr != nil {
		s.logger.Error("retrieval: dense search failed", "error", denseErr)
	}
	if lexicalErr != nil {
		s.logger.Error("retrieval: lexical search failed", "error", lexicalErr)
	}

	// If both failed, return error.
	if denseErr != nil && lexicalErr != nil {
		return nil, fmt.Errorf("retrieval: both search modes failed")
	}

	userLevel := ""
	userTopic := ""
	if userCtx != nil {
		userLevel = userCtx.CEFRLevel
		userTopic = userCtx.GoalSlug
	}

	results := s.reranker.Merge(denseResults, lexicalResults, userLevel, userTopic, s.maxChunks)

	s.logger.Info("retrieval: search completed",
		"dense_count", len(denseResults),
		"lexical_count", len(lexicalResults),
		"merged_count", len(results),
	)

	return results, nil
}
