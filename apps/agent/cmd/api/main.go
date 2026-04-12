package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/steviggio/speakio-agent/internal/agent"
	"github.com/steviggio/speakio-agent/internal/auth"
	"github.com/steviggio/speakio-agent/internal/config"
	"github.com/steviggio/speakio-agent/internal/contextbuilder"
	"github.com/steviggio/speakio-agent/internal/embedding"
	"github.com/steviggio/speakio-agent/internal/httpapi"
	"github.com/steviggio/speakio-agent/internal/ingestion"
	"github.com/steviggio/speakio-agent/internal/llm"
	"github.com/steviggio/speakio-agent/internal/observability"
	"github.com/steviggio/speakio-agent/internal/retrieval"
	"github.com/steviggio/speakio-agent/internal/storage"
	"github.com/steviggio/speakio-agent/internal/users"
)

func main() {
	// Load .env file if present (non-fatal if missing).
	_ = godotenv.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Load configuration.
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Observability.
	logger := observability.NewLogger(cfg.LogLevel)
	slog.SetDefault(logger)
	metrics := observability.NewMetrics()
	_ = metrics

	logger.Info("starting speakio agent API",
		"port", cfg.Port,
		"env", cfg.AppEnv,
		"version", cfg.Version,
	)

	// Storage.
	pool, err := storage.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to postgres", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	rdb, err := storage.NewRedisClient(ctx, cfg.RedisURL)
	if err != nil {
		logger.Error("failed to connect to redis", "error", err)
		os.Exit(1)
	}
	defer rdb.Close()

	// Services.
	authSvc := auth.NewService(cfg.JWTSecret)
	userRepo := users.NewRepository(pool)
	userSvc := users.NewService(userRepo)
	contextSvc := contextbuilder.NewService(userSvc, logger)

	embeddingClient := embedding.NewClient(cfg.EmbeddingURL, cfg.EmbeddingModel, cfg.EmbeddingTimeout)
	llmClient := llm.NewClient(cfg.VLLMBaseURL, cfg.VLLMModel, cfg.LLMTimeout)

	pgvectorStore := retrieval.NewPgvectorStore(pool)
	reranker := retrieval.NewReranker()
	retrievalSvc := retrieval.NewService(pgvectorStore, embeddingClient, reranker, logger, cfg.MaxRetrievalChunks)

	promptBuilder := agent.NewPromptBuilder()
	formatter := agent.NewResponseFormatter()
	agentSvc := agent.NewService(contextSvc, retrievalSvc, promptBuilder, formatter, llmClient, userSvc, logger)

	// Ingestion (for sync admin endpoint).
	fetcher := ingestion.NewFetcher(cfg.FetchTimeout)
	cleaner := ingestion.NewCleaner()
	mdConverter := ingestion.NewMarkdownConverter()
	chunker := ingestion.NewChunker(512)
	enricher := ingestion.NewEnricher()
	dedup := ingestion.NewDedup()
	ingestionSvc := ingestion.NewService(fetcher, cleaner, mdConverter, chunker, enricher, dedup, embeddingClient, pool, cfg.EmbeddingModel, logger)

	// Router.
	router := httpapi.NewRouter(cfg, logger, pool, rdb, authSvc, userSvc, agentSvc, ingestionSvc)

	// HTTP server.
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second, // Long for SSE streaming.
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown.
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		logger.Info("shutdown signal received")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer shutdownCancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Error("server shutdown error", "error", err)
		}
	}()

	logger.Info("server listening", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}

	logger.Info("server stopped")
}
