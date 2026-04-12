package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/steviggio/speakio-agent/internal/auth"
	"github.com/steviggio/speakio-agent/internal/users"
	"github.com/steviggio/speakio-agent/internal/validation"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// UsersHandler exposes user profile and configuration endpoints.
type UsersHandler struct {
	userSvc *users.Service
	logger  *slog.Logger
}

// NewUsersHandler creates a users handler.
func NewUsersHandler(userSvc *users.Service, logger *slog.Logger) *UsersHandler {
	return &UsersHandler{userSvc: userSvc, logger: logger}
}

// ProfileUpsertRequest represents the JSON payload to update a language profile.
type ProfileUpsertRequest struct {
	TargetLanguage         string   `json:"targetLanguage" validate:"required,min=2,max=10"`
	CEFRLevel              string   `json:"cefrLevel" validate:"required,oneof=A1 A2 B1 B2 C1 C2 native"`
	PreferredResourceTypes []string `json:"preferredResourceTypes"`
}

// UpsertProfile handles POST /v1/users/profile
func (h *UsersHandler) UpsertProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.UserIDFromContext(ctx)

	var req ProfileUpsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload")
		return
	}

	if err := validation.Validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error")
		return
	}

	profile := &models.UserLanguageProfile{
		UserID:                 userID,
		TargetLanguage:         req.TargetLanguage,
		CEFRLevel:              req.CEFRLevel,
		PreferredResourceTypes: req.PreferredResourceTypes,
	}

	if err := h.userSvc.UpsertLanguageProfile(ctx, profile); err != nil {
		h.logger.Error("failed to upsert language profile", "error", err, "user_id", userID)
		writeError(w, http.StatusInternalServerError, "database_error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
