package httpapi

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"github.com/steviggio/speakio-agent/internal/agent"
	"github.com/steviggio/speakio-agent/internal/auth"
	"github.com/steviggio/speakio-agent/internal/config"
	"github.com/steviggio/speakio-agent/internal/ingestion"
	"github.com/steviggio/speakio-agent/internal/users"
)

// NewRouter assembles the chi router with all middlewares and routes.
func NewRouter(
	cfg *config.Config,
	logger *slog.Logger,
	pool *pgxpool.Pool,
	rdb *redis.Client,
	authSvc *auth.Service,
	userSvc *users.Service,
	agentSvc *agent.Service,
	ingestionSvc *ingestion.Service,
) http.Handler {
	r := chi.NewRouter()

	// Global middlewares.
	r.Use(RecoveryMiddleware(logger))
	r.Use(LoggingMiddleware(logger))
	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(RateLimitMiddleware(cfg.RateLimitRPM, 1*time.Minute))

	// CORS headers for frontend.
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Handlers.
	healthHandler := NewHealthHandler(pool, rdb, cfg)
	agentHandler := NewAgentHandler(agentSvc, logger)
	adminHandler := NewAdminHandler(ingestionSvc, rdb, logger)
	usersHandler := NewUsersHandler(userSvc, logger)

	// Internal routes (no auth required for health/metrics).
	r.Group(func(r chi.Router) {
		r.Get("/internal/health", healthHandler.Health)
		r.Get("/internal/ready", ReadyCheck(pool))
		r.Handle("/internal/metrics", promhttp.Handler())
	})

	// Public API routes (auth required).
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware(authSvc))

		// Agent Conversational Endpoints
		r.Post("/v1/agent/chat", agentHandler.Chat)
		r.Post("/v1/agent/recommendations", agentHandler.Recommendations)
		r.Post("/v1/agent/explain", agentHandler.Explain)

		// Learner Profile Endpoints
		r.Post("/v1/users/profile", usersHandler.UpsertProfile)
	})

	// Admin routes (auth required, admin role checked in handlers).
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware(authSvc))

		r.Post("/internal/ingestion/url", adminHandler.IngestURL)
		r.Post("/internal/ingestion/batch", adminHandler.IngestBatch)
	})

	return r
}
