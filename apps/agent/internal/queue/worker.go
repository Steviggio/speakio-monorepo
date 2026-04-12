package queue

import (
	"context"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/steviggio/speakio-agent/internal/ingestion"
	"github.com/steviggio/speakio-agent/internal/observability"
)

// Worker continuously dequeues and processes ingestion jobs.
type Worker struct {
	rdb        *redis.Client
	ingestion  *ingestion.Service
	metrics    *observability.Metrics
	logger     *slog.Logger
	pollTimeout time.Duration
}

// NewWorker creates an ingestion worker.
func NewWorker(
	rdb *redis.Client,
	ingestionSvc *ingestion.Service,
	metrics *observability.Metrics,
	logger *slog.Logger,
) *Worker {
	return &Worker{
		rdb:         rdb,
		ingestion:   ingestionSvc,
		metrics:     metrics,
		logger:      logger,
		pollTimeout: 5 * time.Second,
	}
}

// Run starts the worker loop. It blocks until the context is cancelled.
func (w *Worker) Run(ctx context.Context) {
	w.logger.Info("worker: started, waiting for jobs")

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("worker: shutting down")
			return
		default:
		}

		job, err := Dequeue(ctx, w.rdb, w.pollTimeout)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			w.logger.Error("worker: dequeue error", "error", err)
			time.Sleep(1 * time.Second)
			continue
		}

		if job == nil {
			continue
		}

		w.logger.Info("worker: processing job", "url", job.URL, "language", job.Language)

		start := time.Now()
		if err := w.ingestion.IngestURL(ctx, job.URL, job.Language); err != nil {
			w.logger.Error("worker: ingestion failed", "url", job.URL, "error", err)
		} else {
			w.logger.Info("worker: ingestion completed", "url", job.URL, "duration_ms", time.Since(start).Milliseconds())
		}

		w.metrics.IngestionDuration.Observe(time.Since(start).Seconds())
	}
}
