package httpapi

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/steviggio/speakio-agent/internal/config"
)

// HealthHandler returns the service health status.
type HealthHandler struct {
	pool    *pgxpool.Pool
	rdb     *redis.Client
	version string
}

// NewHealthHandler creates a health handler.
func NewHealthHandler(pool *pgxpool.Pool, rdb *redis.Client, cfg *config.Config) *HealthHandler {
	return &HealthHandler{
		pool:    pool,
		rdb:     rdb,
		version: cfg.Version,
	}
}

// Health checks Postgres and Redis connectivity.
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	pgStatus := "ok"
	if err := h.pool.Ping(ctx); err != nil {
		pgStatus = "error: " + err.Error()
	}

	redisStatus := "ok"
	if err := h.rdb.Ping(ctx).Err(); err != nil {
		redisStatus = "error: " + err.Error()
	}

	status := "ok"
	httpStatus := http.StatusOK
	if pgStatus != "ok" || redisStatus != "ok" {
		status = "degraded"
		httpStatus = http.StatusServiceUnavailable
	}

	resp := map[string]string{
		"status":   status,
		"version":  h.version,
		"postgres": pgStatus,
		"redis":    redisStatus,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	json.NewEncoder(w).Encode(resp)
}

// ReadyCheck is a simple readiness probe for orchestrators.
func ReadyCheck(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(context.Background()); err != nil {
			http.Error(w, "not ready", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}
}
