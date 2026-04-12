package retrieval

import "github.com/steviggio/speakio-agent/pkg/models"

// Filters builds the WHERE clause components for retrieval queries.
type Filters struct{}

// CEFRLevelOrder maps CEFR levels to a numeric order for ≤ comparisons.
var CEFRLevelOrder = map[string]int{
	"A1": 1,
	"A2": 2,
	"B1": 3,
	"B2": 4,
	"C1": 5,
	"C2": 6,
}

// AllowedLevels returns the CEFR levels up to and including the given max level.
func AllowedLevels(maxLevel string) []string {
	maxOrd, ok := CEFRLevelOrder[maxLevel]
	if !ok {
		return []string{"A1", "A2", "B1", "B2", "C1", "C2"}
	}
	var levels []string
	for level, ord := range CEFRLevelOrder {
		if ord <= maxOrd {
			levels = append(levels, level)
		}
	}
	return levels
}

// BuildRetrievalQuery enriches a raw user message with context-derived filters.
func BuildRetrievalQuery(msg string, ctx *models.UserContext, limit int) *models.RetrievalQuery {
	q := &models.RetrievalQuery{
		Text:  msg,
		Limit: limit,
	}

	if ctx != nil {
		q.Language = ctx.TargetLanguage
		q.CEFRLevelMax = ctx.CEFRLevel
		if ctx.GoalSlug != "" {
			q.Topic = ctx.GoalSlug
		}
	}

	return q
}
