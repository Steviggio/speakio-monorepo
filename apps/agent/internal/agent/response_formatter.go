package agent

import (
	"encoding/json"

	"github.com/steviggio/speakio-agent/pkg/models"
)

// ResponseFormatter parses and structures the LLM output for typed endpoints.
type ResponseFormatter struct{}

// NewResponseFormatter creates a response formatter.
func NewResponseFormatter() *ResponseFormatter {
	return &ResponseFormatter{}
}

// ParseRecommendation attempts to parse the LLM output as a structured
// recommendation response. Falls back to wrapping the raw text as advice.
func (rf *ResponseFormatter) ParseRecommendation(raw string) *models.RecommendationResponse {
	var resp models.RecommendationResponse
	if err := json.Unmarshal([]byte(raw), &resp); err != nil {
		return &models.RecommendationResponse{
			Advice:     raw,
			Resources:  []models.RecommendedResource{},
			Vocabulary: []models.VocabularyItem{},
		}
	}
	return &resp
}
