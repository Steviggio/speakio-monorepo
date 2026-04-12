package models

import "github.com/google/uuid"

// RetrievalQuery encapsulates everything the retrieval layer needs to find
// relevant chunks: the raw user query, optional filters, and the embedding.
type RetrievalQuery struct {
	Text           string    `json:"text"`
	Embedding      []float32 `json:"-"`
	Language       string    `json:"language,omitempty"`
	CEFRLevelMax   string    `json:"cefrLevelMax,omitempty"`
	Category       string    `json:"category,omitempty"`
	Topic          string    `json:"topic,omitempty"`
	Limit          int       `json:"limit"`
}

// RetrievalResult is a single scored chunk returned by the retrieval engine.
type RetrievalResult struct {
	ChunkID     uuid.UUID `json:"chunkId"`
	DocumentID  uuid.UUID `json:"documentId"`
	Title       string    `json:"title"`
	ChunkText   string    `json:"chunkText"`
	Topic       string    `json:"topic"`
	Category    string    `json:"category"`
	CEFRLevel   string    `json:"cefrLevel"`
	Score       float64   `json:"score"`
	SourceURL   string    `json:"sourceUrl"`
	ScoreDetail ScoreBreakdown `json:"scoreDetail,omitempty"`
}

// ScoreBreakdown provides transparency into how the final retrieval score was
// computed (vector similarity, keyword overlap, metadata bonuses).
type ScoreBreakdown struct {
	VectorScore  float64 `json:"vectorScore"`
	KeywordScore float64 `json:"keywordScore"`
	LevelMatch   float64 `json:"levelMatch"`
	TopicMatch   float64 `json:"topicMatch"`
	QualityScore float64 `json:"qualityScore"`
}

// UserContext is the assembled profile the prompt builder uses to personalise
// the agent's responses — CEFR level, current page, recent mistakes, etc.
type UserContext struct {
	UserID           uuid.UUID `json:"userId"`
	TargetLanguage   string    `json:"targetLanguage"`
	CEFRLevel        string    `json:"cefrLevel"`
	CurrentPage      string    `json:"currentPage"`
	GoalSlug         string    `json:"goalSlug"`
	RecentMistakes   []string  `json:"recentMistakes"`
	PreferredFormats []string  `json:"preferredFormats"`
	SessionIntent    string    `json:"sessionIntent"`
}
