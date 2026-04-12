package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/steviggio/speakio-agent/internal/config"
	"github.com/steviggio/speakio-agent/internal/embedding"
	"github.com/steviggio/speakio-agent/internal/ingestion"
	"github.com/steviggio/speakio-agent/internal/observability"
	"github.com/steviggio/speakio-agent/internal/queue"
	"github.com/steviggio/speakio-agent/internal/storage"
)

func main() {
	// Load .env file if present (non-fatal if missing).
	_ = godotenv.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger := observability.NewLogger(cfg.LogLevel)
	slog.SetDefault(logger)
	metrics := observability.NewMetrics()

	logger.Info("starting speakio ingestion worker",
		"env", cfg.AppEnv,
		"version", cfg.Version,
	)

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

	embeddingClient := embedding.NewClient(cfg.EmbeddingURL, cfg.EmbeddingModel, cfg.EmbeddingTimeout)

	fetcher := ingestion.NewFetcher(cfg.FetchTimeout)
	cleaner := ingestion.NewCleaner()
	mdConverter := ingestion.NewMarkdownConverter()
	chunker := ingestion.NewChunker(512)
	enricher := ingestion.NewEnricher()
	dedup := ingestion.NewDedup()
	ingestionSvc := ingestion.NewService(fetcher, cleaner, mdConverter, chunker, enricher, dedup, embeddingClient, pool, cfg.EmbeddingModel, logger)

	worker := queue.NewWorker(rdb, ingestionSvc, metrics, logger)

	// Start queue stats monitor.
	go queue.LogQueueStats(ctx, rdb, logger, 30*1000*1000*1000) // 30s

	// Graceful shutdown.
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		logger.Info("shutdown signal received")
		cancel()
	}()

	worker.Run(ctx)
	logger.Info("worker stopped")
}
