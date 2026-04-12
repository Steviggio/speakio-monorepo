package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Source represents an origin for crawled or manually added content.
type Source struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	SourceType    string     `json:"sourceType" db:"source_type"`
	URL           string     `json:"url" db:"url"`
	Domain        string     `json:"domain" db:"domain"`
	Title         string     `json:"title" db:"title"`
	Language      string     `json:"language" db:"language"`
	License       string     `json:"license" db:"license"`
	IsActive      bool       `json:"isActive" db:"is_active"`
	LastCrawledAt *time.Time `json:"lastCrawledAt" db:"last_crawled_at"`
	Checksum      string     `json:"checksum" db:"checksum"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
}

// Document holds the full-text content extracted from a source.
type Document struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	SourceID        *uuid.UUID `json:"sourceId" db:"source_id"`
	Title           string     `json:"title" db:"title"`
	CanonicalURL    string     `json:"canonicalUrl" db:"canonical_url"`
	Language        string     `json:"language" db:"language"`
	ContentMarkdown string     `json:"contentMarkdown" db:"content_markdown"`
	ContentText     string     `json:"contentText" db:"content_text"`
	Status          string     `json:"status" db:"status"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time  `json:"updatedAt" db:"updated_at"`
}

// DocumentChunk is a semantically coherent fragment of a document, with its
// embedding vector stored alongside pedagogical metadata. This is the primary
// unit consumed by the retrieval and RAG pipeline.
type DocumentChunk struct {
	ID              uuid.UUID        `json:"id" db:"id"`
	DocumentID      uuid.UUID        `json:"documentId" db:"document_id"`
	ChunkIndex      int              `json:"chunkIndex" db:"chunk_index"`
	HeadingPath     string           `json:"headingPath" db:"heading_path"`
	ChunkText       string           `json:"chunkText" db:"chunk_text"`
	TokenEstimate   int              `json:"tokenEstimate" db:"token_estimate"`
	Category        string           `json:"category" db:"category"`
	Topic           string           `json:"topic" db:"topic"`
	CEFRLevel       string           `json:"cefrLevel" db:"cefr_level"`
	DifficultyScore float64          `json:"difficultyScore" db:"difficulty_score"`
	Keywords        []string         `json:"keywords" db:"keywords"`
	ExamplesJSON    json.RawMessage  `json:"examplesJson" db:"examples_json"`
	MetadataJSON    json.RawMessage  `json:"metadataJson" db:"metadata_json"`
	EmbeddingModel  string           `json:"embeddingModel" db:"embedding_model"`
	Embedding       []float32        `json:"-" db:"embedding"`
	CreatedAt       time.Time        `json:"createdAt" db:"created_at"`
}
