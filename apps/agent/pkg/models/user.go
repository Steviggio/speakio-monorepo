package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a platform user.
type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

// UserLanguageProfile stores the learner's configuration for a specific language.
type UserLanguageProfile struct {
	ID                     uuid.UUID `json:"id" db:"id"`
	UserID                 uuid.UUID `json:"userId" db:"user_id"`
	TargetLanguage         string    `json:"targetLanguage" db:"target_language"`
	CEFRLevel              string    `json:"cefrLevel" db:"cefr_level"`
	DailyGoalMinutes       int       `json:"dailyGoalMinutes" db:"daily_goal_minutes"`
	PreferredResourceTypes []string  `json:"preferredResourceTypes" db:"preferred_resource_types"`
	CreatedAt              time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt              time.Time `json:"updatedAt" db:"updated_at"`
}

// UserLearningGoal tracks an individual learning objective.
type UserLearningGoal struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"userId" db:"user_id"`
	Language  string    `json:"language" db:"language"`
	GoalSlug  string    `json:"goalSlug" db:"goal_slug"`
	Status    string    `json:"status" db:"status"`
	Priority  int       `json:"priority" db:"priority"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// UserMistake records a recurring learner error for adaptive teaching.
type UserMistake struct {
	ID         uuid.UUID `json:"id" db:"id"`
	UserID     uuid.UUID `json:"userId" db:"user_id"`
	Language   string    `json:"language" db:"language"`
	Topic      string    `json:"topic" db:"topic"`
	ErrorType  string    `json:"errorType" db:"error_type"`
	Content    string    `json:"content" db:"content"`
	Frequency  int       `json:"frequency" db:"frequency"`
	LastSeenAt time.Time `json:"lastSeenAt" db:"last_seen_at"`
}

// UserInteraction logs a single conversation exchange with the agent.
type UserInteraction struct {
	ID              uuid.UUID   `json:"id" db:"id"`
	UserID          uuid.UUID   `json:"userId" db:"user_id"`
	PageContext     string      `json:"pageContext" db:"page_context"`
	Query           string      `json:"query" db:"query"`
	ResponseSummary string      `json:"responseSummary" db:"response_summary"`
	RetrievedDocIDs []uuid.UUID `json:"retrievedDocIds" db:"retrieved_doc_ids"`
	CreatedAt       time.Time   `json:"createdAt" db:"created_at"`
}
