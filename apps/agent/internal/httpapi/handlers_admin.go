package httpapi

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/redis/go-redis/v9"
	"github.com/steviggio/speakio-agent/internal/auth"
	"github.com/steviggio/speakio-agent/internal/ingestion"
	"github.com/steviggio/speakio-agent/internal/queue"
	"github.com/steviggio/speakio-agent/internal/validation"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// AdminHandler exposes internal/admin endpoints for ingestion and management.
type AdminHandler struct {
	ingestionSvc *ingestion.Service
	rdb          *redis.Client
	logger       *slog.Logger
}

// NewAdminHandler creates an admin handler.
func NewAdminHandler(ingestionSvc *ingestion.Service, rdb *redis.Client, logger *slog.Logger) *AdminHandler {
	return &AdminHandler{
		ingestionSvc: ingestionSvc,
		rdb:          rdb,
		logger:       logger,
	}
}

// IngestURL handles POST /internal/ingestion/url — synchronous single-URL ingestion.
func (h *AdminHandler) IngestURL(w http.ResponseWriter, r *http.Request) {
	// Require admin role.
	role := auth.UserRoleFromContext(r.Context())
	if role != "ADMIN" {
		writeError(w, http.StatusForbidden, "admin_required")
		return
	}

	var req models.IngestURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload")
		return
	}

	if err := validation.Validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error")
		return
	}

	if err := h.ingestionSvc.IngestURL(r.Context(), req.URL, req.Language); err != nil {
		h.logger.Error("admin: ingestion failed", "url", req.URL, "error", err)
		writeError(w, http.StatusInternalServerError, "ingestion_error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ingested", "url": req.URL})
}

// IngestBatch handles POST /internal/ingestion/batch — queues multiple URLs for async processing.
func (h *AdminHandler) IngestBatch(w http.ResponseWriter, r *http.Request) {
	role := auth.UserRoleFromContext(r.Context())
	if role != "ADMIN" {
		writeError(w, http.StatusForbidden, "admin_required")
		return
	}

	var req models.IngestBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload")
		return
	}

	if err := validation.Validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error")
		return
	}

	ctx := context.Background()
	queued := 0
	for _, u := range req.URLs {
		if err := queue.Enqueue(ctx, h.rdb, queue.Job{URL: u.URL, Language: u.Language}); err != nil {
			h.logger.Error("admin: failed to enqueue", "url", u.URL, "error", err)
			continue
		}
		queued++
	}

	writeJSON(w, http.StatusAccepted, map[string]interface{}{
		"status": "queued",
		"queued": queued,
		"total":  len(req.URLs),
	})
}
