package agent

import (
	"fmt"
	"strings"

	"github.com/steviggio/speakio-agent/internal/llm"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// PromptBuilder constructs the system and user messages for the LLM.
type PromptBuilder struct{}

// NewPromptBuilder creates a prompt builder.
func NewPromptBuilder() *PromptBuilder {
	return &PromptBuilder{}
}

// BuildChat assembles the full prompt for a conversational request.
func (pb *PromptBuilder) BuildChat(
	userCtx *models.UserContext,
	userMessage string,
	retrievedChunks []models.RetrievalResult,
) []llm.ChatMessage {

	systemPrompt := pb.buildSystemPrompt(userCtx)
	contextBlock := pb.buildContextBlock(retrievedChunks)

	messages := []llm.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}

	if contextBlock != "" {
		messages = append(messages, llm.ChatMessage{
			Role: "system",
			Content: fmt.Sprintf("Voici les documents de référence pertinents :\n\n%s\n\nBase-toi uniquement sur ces documents pour répondre.", contextBlock),
		})
	}

	messages = append(messages, llm.ChatMessage{
		Role:    "user",
		Content: userMessage,
	})

	return messages
}

// BuildRecommendation assembles the prompt for a resource recommendation request.
func (pb *PromptBuilder) BuildRecommendation(
	userCtx *models.UserContext,
	req *models.AgentRecommendRequest,
	retrievedChunks []models.RetrievalResult,
) []llm.ChatMessage {

	systemPrompt := pb.buildSystemPrompt(userCtx)
	contextBlock := pb.buildContextBlock(retrievedChunks)

	instruction := fmt.Sprintf(
		`Recommande des ressources pour apprendre le thème "%s" en %s au niveau %s.
Format de réponse attendu (JSON) :
{
  "advice": "conseil global",
  "resources": [{"title": "...", "reason": "...", "difficulty": "..."}],
  "vocabulary": [{"term": "...", "meaning": "...", "example": "..."}]
}
Base-toi uniquement sur le contexte fourni.`,
		req.Topic, req.TargetLanguage, req.CEFRLevel,
	)

	messages := []llm.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}
	if contextBlock != "" {
		messages = append(messages, llm.ChatMessage{
			Role:    "system",
			Content: "Documents de référence :\n\n" + contextBlock,
		})
	}
	messages = append(messages, llm.ChatMessage{Role: "user", Content: instruction})

	return messages
}

// BuildExplanation assembles the prompt for a grammar/concept explanation.
func (pb *PromptBuilder) BuildExplanation(
	userCtx *models.UserContext,
	req *models.AgentExplainRequest,
	retrievedChunks []models.RetrievalResult,
) []llm.ChatMessage {

	systemPrompt := pb.buildSystemPrompt(userCtx)
	contextBlock := pb.buildContextBlock(retrievedChunks)

	instruction := fmt.Sprintf(
		`Explique le concept grammatical "%s" en %s, adapté au niveau %s.
Utilise des exemples simples et concrets.
Si possible, mentionne les erreurs courantes.
Base-toi uniquement sur le contexte fourni.`,
		req.Topic, req.TargetLanguage, req.CEFRLevel,
	)

	messages := []llm.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}
	if contextBlock != "" {
		messages = append(messages, llm.ChatMessage{
			Role:    "system",
			Content: "Documents de référence :\n\n" + contextBlock,
		})
	}
	messages = append(messages, llm.ChatMessage{Role: "user", Content: instruction})

	return messages
}

// buildSystemPrompt creates the dynamic system instruction based on user context.
func (pb *PromptBuilder) buildSystemPrompt(userCtx *models.UserContext) string {
	var parts []string

	parts = append(parts, "Tu es un tuteur linguistique bienveillant et pédagogue.")
	parts = append(parts, "Tu fais partie de la plateforme Speakio, un répertoire communautaire de ressources pour l'apprentissage des langues.")

	if userCtx == nil {
		parts = append(parts, "Adapte tes réponses au niveau de l'utilisateur.")
		return strings.Join(parts, "\n")
	}

	if userCtx.TargetLanguage != "" {
		parts = append(parts, fmt.Sprintf("L'utilisateur apprend le %s.", languageName(userCtx.TargetLanguage)))
	}

	if userCtx.CEFRLevel != "" {
		parts = append(parts, fmt.Sprintf("Son niveau estimé est %s (CECRL).", userCtx.CEFRLevel))
		parts = append(parts, fmt.Sprintf("N'utilise pas de vocabulaire supérieur à %s sauf nécessité pédagogique.", nextLevel(userCtx.CEFRLevel)))
	}

	if userCtx.CurrentPage != "" {
		parts = append(parts, fmt.Sprintf("Il se trouve actuellement sur la page \"%s\".", userCtx.CurrentPage))
	}

	if userCtx.GoalSlug != "" {
		parts = append(parts, fmt.Sprintf("Il travaille le thème \"%s\".", userCtx.GoalSlug))
	}

	if len(userCtx.RecentMistakes) > 0 {
		parts = append(parts, fmt.Sprintf("Ses erreurs récentes : %s.", strings.Join(userCtx.RecentMistakes, ", ")))
		parts = append(parts, "Sois attentif à ces points dans tes explications.")
	}

	if len(userCtx.PreferredFormats) > 0 {
		parts = append(parts, fmt.Sprintf("Il préfère les formats : %s.", strings.Join(userCtx.PreferredFormats, ", ")))
	}

	parts = append(parts, "Réponds de manière concise, structurée et encourageante.")
	parts = append(parts, "Base-toi uniquement sur le contexte fourni pour tes recommandations.")

	return strings.Join(parts, "\n")
}

// buildContextBlock formats retrieved chunks as numbered documents for injection.
func (pb *PromptBuilder) buildContextBlock(chunks []models.RetrievalResult) string {
	if len(chunks) == 0 {
		return ""
	}

	var sb strings.Builder
	for i, c := range chunks {
		fmt.Fprintf(&sb, "[Document %d] (source: %s, niveau: %s, thème: %s)\n%s\n\n",
			i+1, c.SourceURL, c.CEFRLevel, c.Topic, c.ChunkText)
	}
	return sb.String()
}

func languageName(code string) string {
	names := map[string]string{
		"en": "anglais", "es": "espagnol", "fr": "français",
		"de": "allemand", "it": "italien", "pt": "portugais",
		"zh": "chinois", "ja": "japonais", "ko": "coréen",
		"ar": "arabe", "ru": "russe", "nl": "néerlandais",
	}
	if name, ok := names[code]; ok {
		return name
	}
	return code
}

func nextLevel(level string) string {
	order := []string{"A1", "A2", "B1", "B2", "C1", "C2"}
	for i, l := range order {
		if l == level && i+1 < len(order) {
			return order[i+1]
		}
	}
	return "C2"
}
