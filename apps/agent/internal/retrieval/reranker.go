package retrieval

import (
	"sort"

	"github.com/steviggio/speakio-agent/pkg/models"
)

// Reranker applies a weighted scoring formula to merge dense and lexical results.
type Reranker struct{}

// NewReranker creates a reranker.
func NewReranker() *Reranker {
	return &Reranker{}
}

// Merge combines dense and lexical results, deduplicates by chunk ID,
// applies the weighted score formula, and returns the top N results sorted
// by final score descending.
func (rr *Reranker) Merge(
	dense []models.RetrievalResult,
	lexical []models.RetrievalResult,
	userLevel string,
	userTopic string,
	limit int,
) []models.RetrievalResult {

	seen := make(map[string]*models.RetrievalResult)

	// Process dense results.
	for i := range dense {
		key := dense[i].ChunkID.String()
		r := dense[i]
		r.ScoreDetail.VectorScore = r.Score
		seen[key] = &r
	}

	// Process lexical results — merge keyword scores into existing entries.
	for i := range lexical {
		key := lexical[i].ChunkID.String()
		if existing, ok := seen[key]; ok {
			existing.ScoreDetail.KeywordScore = lexical[i].Score
		} else {
			r := lexical[i]
			r.ScoreDetail.KeywordScore = r.Score
			seen[key] = &r
		}
	}

	// Compute final weighted scores.
	var results []models.RetrievalResult
	for _, r := range seen {
		r.ScoreDetail.LevelMatch = levelMatchScore(r.CEFRLevel, userLevel)
		r.ScoreDetail.TopicMatch = topicMatchScore(r.Topic, userTopic)
		r.ScoreDetail.QualityScore = 0.5 // baseline; can be refined later

		r.Score = 0.50*r.ScoreDetail.VectorScore +
			0.20*r.ScoreDetail.KeywordScore +
			0.15*r.ScoreDetail.LevelMatch +
			0.10*r.ScoreDetail.TopicMatch +
			0.05*r.ScoreDetail.QualityScore

		results = append(results, *r)
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	if limit > 0 && len(results) > limit {
		results = results[:limit]
	}

	return results
}

// levelMatchScore rewards results whose CEFR level aligns with the user's.
func levelMatchScore(chunkLevel, userLevel string) float64 {
	if chunkLevel == "" || userLevel == "" {
		return 0.5
	}
	chunkOrd, ok1 := CEFRLevelOrder[chunkLevel]
	userOrd, ok2 := CEFRLevelOrder[userLevel]
	if !ok1 || !ok2 {
		return 0.5
	}
	diff := abs(chunkOrd - userOrd)
	switch diff {
	case 0:
		return 1.0
	case 1:
		return 0.7
	case 2:
		return 0.3
	default:
		return 0.1
	}
}

// topicMatchScore rewards results whose topic matches the current goal.
func topicMatchScore(chunkTopic, userTopic string) float64 {
	if chunkTopic == "" || userTopic == "" {
		return 0.5
	}
	if chunkTopic == userTopic {
		return 1.0
	}
	return 0.3
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
