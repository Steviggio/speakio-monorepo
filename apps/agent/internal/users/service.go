package users

import (
	"context"

	"github.com/google/uuid"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// Service provides business-level access to user data.
type Service struct {
	repo *Repository
}

// NewService creates a user service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// GetProfile returns a user by ID.
func (s *Service) GetProfile(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	return s.repo.GetByID(ctx, userID)
}

// GetLanguageProfile returns the language-specific learner profile.
func (s *Service) GetLanguageProfile(ctx context.Context, userID uuid.UUID, lang string) (*models.UserLanguageProfile, error) {
	return s.repo.GetLanguageProfile(ctx, userID, lang)
}

// UpsertLanguageProfile saves or updates the user language profile.
func (s *Service) UpsertLanguageProfile(ctx context.Context, p *models.UserLanguageProfile) error {
	return s.repo.UpsertLanguageProfile(ctx, p)
}

// GetLearningGoals returns the active learning goals.
func (s *Service) GetLearningGoals(ctx context.Context, userID uuid.UUID, lang string) ([]models.UserLearningGoal, error) {
	return s.repo.GetLearningGoals(ctx, userID, lang)
}

// GetRecentMistakes returns the top mistakes for adaptive teaching.
func (s *Service) GetRecentMistakes(ctx context.Context, userID uuid.UUID, lang string) ([]models.UserMistake, error) {
	return s.repo.GetRecentMistakes(ctx, userID, lang, 10)
}

// SaveInteraction records a conversation exchange.
func (s *Service) SaveInteraction(ctx context.Context, interaction *models.UserInteraction) error {
	return s.repo.SaveInteraction(ctx, interaction)
}
