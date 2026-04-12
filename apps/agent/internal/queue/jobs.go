package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

const ingestionQueueKey = "speakio:ingestion:queue"

// Job represents an ingestion task.
type Job struct {
	URL      string `json:"url"`
	Language string `json:"language"`
}

// Enqueue adds an ingestion job to the Redis queue.
func Enqueue(ctx context.Context, rdb *redis.Client, job Job) error {
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("queue: marshal job: %w", err)
	}
	return rdb.LPush(ctx, ingestionQueueKey, data).Err()
}

// Dequeue blocks until a job is available, then returns it.
func Dequeue(ctx context.Context, rdb *redis.Client, timeout time.Duration) (*Job, error) {
	result, err := rdb.BRPop(ctx, timeout, ingestionQueueKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, fmt.Errorf("queue: dequeue: %w", err)
	}

	if len(result) < 2 {
		return nil, nil
	}

	var job Job
	if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
		return nil, fmt.Errorf("queue: unmarshal job: %w", err)
	}

	return &job, nil
}

// QueueLength returns the current number of pending jobs.
func QueueLength(ctx context.Context, rdb *redis.Client) (int64, error) {
	return rdb.LLen(ctx, ingestionQueueKey).Result()
}

// LogQueueStats periodically logs queue length for monitoring.
func LogQueueStats(ctx context.Context, rdb *redis.Client, logger *slog.Logger, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			length, err := QueueLength(ctx, rdb)
			if err != nil {
				logger.Error("queue: failed to get length", "error", err)
				continue
			}
			if length > 0 {
				logger.Info("queue: pending jobs", "count", length)
			}
		}
	}
}
