package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/steviggio/speakio-agent/internal/agent"
	"github.com/steviggio/speakio-agent/internal/auth"
	"github.com/steviggio/speakio-agent/internal/validation"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// AgentHandler exposes all agent-related endpoints.
type AgentHandler struct {
	agentSvc *agent.Service
	logger   *slog.Logger
}

// NewAgentHandler creates an agent handler.
func NewAgentHandler(agentSvc *agent.Service, logger *slog.Logger) *AgentHandler {
	return &AgentHandler{agentSvc: agentSvc, logger: logger}
}

// Chat handles POST /v1/agent/chat — the main conversational endpoint.
func (h *AgentHandler) Chat(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.UserIDFromContext(ctx)

	var req models.AgentChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload")
		return
	}

	if err := validation.Validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error")
		return
	}

	resp, err := h.agentSvc.Chat(ctx, userID, &req, w)
	if err != nil {
		h.logger.Error("agent chat error", "error", err, "user_id", userID)
		writeError(w, http.StatusInternalServerError, "agent_error")
		return
	}

	// If streaming was used, response was already written to w.
	if resp != nil {
		writeJSON(w, http.StatusOK, resp)
	}
}

// Recommendations handles POST /v1/agent/recommendations.
func (h *AgentHandler) Recommendations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.UserIDFromContext(ctx)

	var req models.AgentRecommendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload")
		return
	}

	if err := validation.Validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error")
		return
	}

	resp, err := h.agentSvc.Recommend(ctx, userID, &req)
	if err != nil {
		h.logger.Error("agent recommendation error", "error", err, "user_id", userID)
		writeError(w, http.StatusInternalServerError, "agent_error")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Explain handles POST /v1/agent/explain.
func (h *AgentHandler) Explain(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.UserIDFromContext(ctx)

	var req models.AgentExplainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload")
		return
	}

	if err := validation.Validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error")
		return
	}

	resp, err := h.agentSvc.Explain(ctx, userID, &req)
	if err != nil {
		h.logger.Error("agent explain error", "error", err, "user_id", userID)
		writeError(w, http.StatusInternalServerError, "agent_error")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// writeJSON serialises data as JSON and writes it to the response.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// writeError writes a standardised JSON error response.
func writeError(w http.ResponseWriter, status int, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": code})
}
