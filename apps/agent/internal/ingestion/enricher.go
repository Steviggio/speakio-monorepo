package ingestion

import (
	"strings"
)

// EnrichedChunk extends a Chunk with pedagogical metadata derived from heuristics.
type EnrichedChunk struct {
	Chunk
	Category        string
	Topic           string
	CEFRLevel       string
	DifficultyScore float64
	Keywords        []string
	Language        string
}

// Enricher applies deterministic heuristics to tag chunks with pedagogical metadata
// without requiring a LLM call.
type Enricher struct{}

// NewEnricher creates an enricher.
func NewEnricher() *Enricher {
	return &Enricher{}
}

// Enrich adds category, topic, CEFR estimation, and keywords to each chunk.
func (e *Enricher) Enrich(chunks []Chunk, language string) []EnrichedChunk {
	enriched := make([]EnrichedChunk, len(chunks))
	for i, c := range chunks {
		ec := EnrichedChunk{
			Chunk:    c,
			Language: language,
		}

		lower := strings.ToLower(c.Text)

		ec.Category = e.detectCategory(lower)
		ec.Topic = e.detectTopic(lower)
		ec.CEFRLevel = e.estimateCEFR(c.Text)
		ec.DifficultyScore = e.difficultyScore(c.Text)
		ec.Keywords = e.extractKeywords(lower)

		enriched[i] = ec
	}
	return enriched
}

func (e *Enricher) detectCategory(lower string) string {
	categoryKeywords := map[string][]string{
		"grammar":       {"grammar", "grammaire", "gramática", "verb", "tense", "conjugation", "conjugaison", "subjunctive", "subjonctif", "adjective", "adjectif", "noun", "pronoun", "pronom"},
		"vocabulary":    {"vocabulary", "vocabulaire", "word", "mot", "expression", "phrase", "idiom", "lexique"},
		"pronunciation": {"pronunciation", "prononciation", "phonetic", "phonétique", "accent", "intonation", "sound"},
		"dialogue":      {"dialogue", "conversation", "dialog", "speaking", "parler"},
		"culture":       {"culture", "tradition", "custom", "history", "histoire", "society", "société"},
	}

	for cat, keywords := range categoryKeywords {
		for _, kw := range keywords {
			if strings.Contains(lower, kw) {
				return cat
			}
		}
	}
	return "general"
}

func (e *Enricher) detectTopic(lower string) string {
	topicKeywords := map[string][]string{
		"greetings":     {"hello", "hi ", "bonjour", "hola", "good morning", "good evening", "salut", "buenos días"},
		"introductions": {"my name", "je m'appelle", "me llamo", "introduce", "présenter", "presentarse"},
		"farewells":     {"goodbye", "au revoir", "adiós", "bye", "see you", "à bientôt", "hasta luego"},
		"restaurant":    {"restaurant", "food", "nourriture", "menu", "order", "commander", "meal", "repas"},
		"travel":        {"travel", "voyage", "airport", "aéroport", "hotel", "hôtel", "train", "bus"},
		"family":        {"family", "famille", "mother", "father", "mère", "père", "parent", "child", "enfant"},
		"weather":       {"weather", "météo", "rain", "pluie", "sun", "soleil", "temperature", "température"},
		"numbers":       {"number", "nombre", "count", "compter", "digit", "chiffre"},
		"time":          {"time", "heure", "clock", "horloge", "minute", "hour", "day", "jour"},
		"shopping":      {"shop", "magasin", "buy", "acheter", "price", "prix", "cost", "coût"},
	}

	for topic, keywords := range topicKeywords {
		matchCount := 0
		for _, kw := range keywords {
			if strings.Contains(lower, kw) {
				matchCount++
			}
		}
		if matchCount >= 2 {
			return topic
		}
	}

	// Single match fallback.
	for topic, keywords := range topicKeywords {
		for _, kw := range keywords {
			if strings.Contains(lower, kw) {
				return topic
			}
		}
	}

	return ""
}

func (e *Enricher) estimateCEFR(text string) string {
	words := strings.Fields(text)
	if len(words) == 0 {
		return "A1"
	}

	avgWordLen := 0.0
	for _, w := range words {
		avgWordLen += float64(len(w))
	}
	avgWordLen /= float64(len(words))

	sentences := strings.Count(text, ".") + strings.Count(text, "!") + strings.Count(text, "?")
	if sentences == 0 {
		sentences = 1
	}
	avgSentenceLen := float64(len(words)) / float64(sentences)

	// Simple heuristic: short words + short sentences = easier.
	switch {
	case avgWordLen < 4.5 && avgSentenceLen < 8:
		return "A1"
	case avgWordLen < 5.0 && avgSentenceLen < 12:
		return "A2"
	case avgWordLen < 5.5 && avgSentenceLen < 18:
		return "B1"
	case avgWordLen < 6.0 && avgSentenceLen < 25:
		return "B2"
	default:
		return "C1"
	}
}

func (e *Enricher) difficultyScore(text string) float64 {
	words := strings.Fields(text)
	if len(words) == 0 {
		return 0.1
	}

	avgWordLen := 0.0
	for _, w := range words {
		avgWordLen += float64(len(w))
	}
	avgWordLen /= float64(len(words))

	// Normalise to 0-1 range (4 chars → 0.2, 8 chars → 1.0).
	score := (avgWordLen - 3.0) / 5.0
	if score < 0.1 {
		score = 0.1
	}
	if score > 1.0 {
		score = 1.0
	}
	return score
}

func (e *Enricher) extractKeywords(lower string) []string {
	allKeywords := []string{
		"grammar", "grammaire", "vocabulary", "vocabulaire",
		"verb", "verbe", "noun", "adjectif", "adjective",
		"conjugation", "conjugaison", "tense", "temps",
		"present", "past", "future", "passé", "futur",
		"dialogue", "conversation", "pronunciation", "prononciation",
		"exercise", "exercice", "example", "exemple",
	}

	var found []string
	for _, kw := range allKeywords {
		if strings.Contains(lower, kw) {
			found = append(found, kw)
		}
	}
	return found
}
