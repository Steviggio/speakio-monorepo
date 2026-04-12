package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/steviggio/speakio-agent/internal/config"
	"github.com/steviggio/speakio-agent/internal/embedding"
	"github.com/steviggio/speakio-agent/internal/ingestion"
	"github.com/steviggio/speakio-agent/internal/observability"
	"github.com/steviggio/speakio-agent/internal/retrieval"
	"github.com/steviggio/speakio-agent/internal/storage"
	"github.com/steviggio/speakio-agent/pkg/models"
)

func main() {
	_ = godotenv.Load("../../.env") // Load from the apps/agent dir
	_ = godotenv.Load()

	ctx := context.Background()
	logger := observability.NewLogger("debug")
	slog.SetDefault(logger)

	// 1. SERVER MOCK (Simule Mistral / OpenAI Embeddings)
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/embeddings" {
			var req struct {
				Input []string `json:"input"`
			}
			_ = json.NewDecoder(r.Body).Decode(&req)

			type DataItem struct {
				Embedding []float32 `json:"embedding"`
				Index     int       `json:"index"`
			}
			var data []DataItem
			for i := range req.Input {
				// Vecteur dummy de 1024 dimensions (comme BAAI/bge-m3)
				emb := make([]float32, 1024)
				emb[0] = 0.5
				emb[1] = 0.2
				data = append(data, DataItem{Embedding: emb, Index: i})
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"data": data})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockServer.Close()
	logger.Info("Mock Embedding Server started", "url", mockServer.URL)

	// 2. CONFIGURATION
	cfg, err := config.Load()
	if err != nil {
		logger.Error("Config error", "err", err)
		os.Exit(1)
	}
	cfg.EmbeddingURL = mockServer.URL // Override avec le mock
	cfg.EmbeddingModel = "mock-model"

	// 3. STORAGE
	pool, err := storage.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("DB error", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	// 4. INSTANCIATION DES SERVICES
	embClient := embedding.NewClient(cfg.EmbeddingURL, cfg.EmbeddingModel, 10*time.Second)

	// -> Pipeline Ingestion
	fetcher := ingestion.NewFetcher(15 * time.Second)
	cleaner := ingestion.NewCleaner()
	mdConv := ingestion.NewMarkdownConverter()
	chunker := ingestion.NewChunker(256)
	enricher := ingestion.NewEnricher()
	dedup := ingestion.NewDedup()
	ingestSvc := ingestion.NewService(fetcher, cleaner, mdConv, chunker, enricher, dedup, embClient, pool, cfg.EmbeddingModel, logger)

	// -> Pipeline Retrieval
	pgvStore := retrieval.NewPgvectorStore(pool)
	reranker := retrieval.NewReranker()
	retrievalSvc := retrieval.NewService(pgvStore, embClient, reranker, logger, 5)

	// 5. TEST: INGESTION
	testURL := "https://example.com"
	logger.Info("=============================")
	logger.Info("TEST 1: INGESTION WEB")
	logger.Info("=============================")

	// Cleanup avant le test histoire d'avoir un résultat frais
	_, _ = pool.Exec(ctx, "DELETE FROM sources WHERE url = $1", testURL)

	err = ingestSvc.IngestURL(ctx, testURL, "en")
	if err != nil {
		logger.Error("Ingestion failed", "err", err)
		os.Exit(1)
	}

	// Récupérer le nombre de chunks créés
	var chunkCount int
	_ = pool.QueryRow(ctx, "SELECT count(*) FROM document_chunks JOIN documents d ON d.id = document_id JOIN sources s ON s.id = d.source_id WHERE s.url = $1", testURL).Scan(&chunkCount)
	logger.Info("Validation Ingestion", "chunks_crees_dans_db", chunkCount)

	// 6. TEST: RETRIEVAL (Recherche sémantique)
	logger.Info("=============================")
	logger.Info("TEST 2: HYBRID RETRIEVAL")
	logger.Info("=============================")

	userCtx := &models.UserContext{
		TargetLanguage: "en",
		CEFRLevel:      "B2",
		GoalSlug:       "general",
	}

	// Recherche d'un mot présent sur example.com
	searchQuery := "domain"
	logger.Info("Lancement de la recherche...", "query", searchQuery)
	results, err := retrievalSvc.Search(ctx, userCtx, searchQuery)
	if err != nil {
		logger.Error("Retrieval failed", "err", err)
		os.Exit(1)
	}

	logger.Info(fmt.Sprintf("Trouvé %d resultats pour la requete '%s'", len(results), searchQuery))
	for i, r := range results {
		fmt.Printf("\n--- Resultat %d ---\n", i+1)
		fmt.Printf("Score Final : %f\n", r.Score)
		fmt.Printf("Détails     : Vector(%.2f) Lexical(%.2f) Level(%.2f)\n", r.ScoreDetail.VectorScore, r.ScoreDetail.KeywordScore, r.ScoreDetail.LevelMatch)
		fmt.Printf("Texte       : %s\n", r.ChunkText)
	}
}
