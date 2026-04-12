package contextbuilder

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
	"github.com/steviggio/speakio-agent/internal/users"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// Service assembles the UserContext consumed by the prompt builder.
// It batches user data loads to minimise DB round-trips.
type Service struct {
	userSvc *users.Service
	logger  *slog.Logger
}

// NewService creates a context builder.
func NewService(userSvc *users.Service, logger *slog.Logger) *Service {
	return &Service{userSvc: userSvc, logger: logger}
}

// Build loads the user profile, language preferences, learning goals, and
// recent mistakes, then merges them with the request-level context (page, goal).
func (s *Service) Build(ctx context.Context, userID uuid.UUID, req *models.AgentChatRequest) (*models.UserContext, error) {
	uc := &models.UserContext{
		UserID:      userID,
		CurrentPage: req.PageContext,
		GoalSlug:    req.GoalSlug,
	}

	targetLang := req.TargetLanguage

	// Load language profile.
	if targetLang != "" {
		profile, err := s.userSvc.GetLanguageProfile(ctx, userID, targetLang)
		if err != nil {
			s.logger.Warn("contextbuilder: no language profile found", "user_id", userID, "lang", targetLang, "error", err)
		} else {
			uc.TargetLanguage = profile.TargetLanguage
			uc.CEFRLevel = profile.CEFRLevel
			uc.PreferredFormats = profile.PreferredResourceTypes
		}
	}

	// Load recent mistakes.
	if targetLang != "" {
		mistakes, err := s.userSvc.GetRecentMistakes(ctx, userID, targetLang)
		if err != nil {
			s.logger.Warn("contextbuilder: failed to load mistakes", "user_id", userID, "error", err)
		} else {
			for _, m := range mistakes {
				uc.RecentMistakes = append(uc.RecentMistakes, m.Content)
			}
		}
	}

	// Infer session intent from page context.
	switch req.PageContext {
	case "roadmap":
		uc.SessionIntent = "resource_advice"
	case "exercise":
		uc.SessionIntent = "practice_help"
	case "exploration":
		uc.SessionIntent = "discovery"
	default:
		uc.SessionIntent = "general"
	}

	return uc, nil
}
