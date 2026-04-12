package users

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// Repository provides read access to user data in Postgres.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a user repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// GetByID returns a user by primary key.
func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = $1`, id)

	var u models.User
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, fmt.Errorf("users/repo: get by id: %w", err)
	}
	return &u, nil
}

// GetLanguageProfile returns the language profile for a user and target language.
func (r *Repository) GetLanguageProfile(ctx context.Context, userID uuid.UUID, lang string) (*models.UserLanguageProfile, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT id, user_id, target_language, cefr_level, daily_goal_minutes,
		        preferred_resource_types, created_at, updated_at
		 FROM user_language_profiles
		 WHERE user_id = $1 AND target_language = $2`, userID, lang)

	var p models.UserLanguageProfile
	if err := row.Scan(
		&p.ID, &p.UserID, &p.TargetLanguage, &p.CEFRLevel,
		&p.DailyGoalMinutes, &p.PreferredResourceTypes,
		&p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("users/repo: get language profile: %w", err)
	}
	return &p, nil
}

// UpsertLanguageProfile creates or updates the language learning profile for a user.
func (r *Repository) UpsertLanguageProfile(ctx context.Context, p *models.UserLanguageProfile) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_language_profiles 
			(user_id, target_language, cefr_level, preferred_resource_types, updated_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 ON CONFLICT (user_id, target_language) DO UPDATE SET
		 	cefr_level = EXCLUDED.cefr_level,
		 	preferred_resource_types = EXCLUDED.preferred_resource_types,
		 	updated_at = NOW()`,
		p.UserID, p.TargetLanguage, p.CEFRLevel, p.PreferredResourceTypes)
	if err != nil {
		return fmt.Errorf("users/repo: upsert language profile: %w", err)
	}
	return nil
}

// GetLearningGoals returns the user's active learning goals for a language.
func (r *Repository) GetLearningGoals(ctx context.Context, userID uuid.UUID, lang string) ([]models.UserLearningGoal, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, language, goal_slug, status, priority, created_at, updated_at
		 FROM user_learning_goals
		 WHERE user_id = $1 AND language = $2
		 ORDER BY priority DESC, created_at DESC`, userID, lang)
	if err != nil {
		return nil, fmt.Errorf("users/repo: get learning goals: %w", err)
	}
	defer rows.Close()

	var goals []models.UserLearningGoal
	for rows.Next() {
		var g models.UserLearningGoal
		if err := rows.Scan(
			&g.ID, &g.UserID, &g.Language, &g.GoalSlug,
			&g.Status, &g.Priority, &g.CreatedAt, &g.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("users/repo: scan learning goal: %w", err)
		}
		goals = append(goals, g)
	}
	return goals, rows.Err()
}

// GetRecentMistakes returns the user's most frequent mistakes for a language.
func (r *Repository) GetRecentMistakes(ctx context.Context, userID uuid.UUID, lang string, limit int) ([]models.UserMistake, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, language, topic, error_type, content, frequency, last_seen_at
		 FROM user_mistakes
		 WHERE user_id = $1 AND language = $2
		 ORDER BY frequency DESC, last_seen_at DESC
		 LIMIT $3`, userID, lang, limit)
	if err != nil {
		return nil, fmt.Errorf("users/repo: get recent mistakes: %w", err)
	}
	defer rows.Close()

	var mistakes []models.UserMistake
	for rows.Next() {
		var m models.UserMistake
		if err := rows.Scan(
			&m.ID, &m.UserID, &m.Language, &m.Topic,
			&m.ErrorType, &m.Content, &m.Frequency, &m.LastSeenAt,
		); err != nil {
			return nil, fmt.Errorf("users/repo: scan mistake: %w", err)
		}
		mistakes = append(mistakes, m)
	}
	return mistakes, rows.Err()
}

// SaveInteraction persists a conversation exchange for analytics and memory.
func (r *Repository) SaveInteraction(ctx context.Context, interaction *models.UserInteraction) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_interactions (id, user_id, page_context, query, response_summary, retrieved_doc_ids, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		interaction.ID, interaction.UserID, interaction.PageContext,
		interaction.Query, interaction.ResponseSummary,
		interaction.RetrievedDocIDs, interaction.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("users/repo: save interaction: %w", err)
	}
	return nil
}
