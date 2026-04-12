package models

// AgentChatRequest is the payload sent by the frontend to start a conversation.
type AgentChatRequest struct {
	Message        string `json:"message" validate:"required,min=1,max=2000"`
	PageContext    string `json:"pageContext" validate:"omitempty,oneof=roadmap exercise exploration profile"`
	GoalSlug       string `json:"goalSlug" validate:"omitempty,max=100"`
	TargetLanguage string `json:"targetLanguage" validate:"omitempty,max=10"`
	Stream         bool   `json:"stream"`
}

// AgentRecommendRequest asks the agent for curated resource suggestions.
type AgentRecommendRequest struct {
	TargetLanguage string `json:"targetLanguage" validate:"required,max=10"`
	Topic          string `json:"topic" validate:"omitempty,max=100"`
	CEFRLevel      string `json:"cefrLevel" validate:"omitempty,oneof=A1 A2 B1 B2 C1 C2"`
	Format         string `json:"format" validate:"omitempty,oneof=dialogue lesson exercise vocabulary"`
}

// AgentExplainRequest asks the agent to explain a grammar or language concept.
type AgentExplainRequest struct {
	Topic          string `json:"topic" validate:"required,max=200"`
	TargetLanguage string `json:"targetLanguage" validate:"required,max=10"`
	CEFRLevel      string `json:"cefrLevel" validate:"omitempty,oneof=A1 A2 B1 B2 C1 C2"`
}

// AgentResponse is the non-streaming response envelope.
type AgentResponse struct {
	Content string `json:"content"`
}

// RecommendationResponse is the structured response for resource recommendations.
type RecommendationResponse struct {
	Advice     string               `json:"advice"`
	Resources  []RecommendedResource `json:"resources"`
	Vocabulary []VocabularyItem      `json:"vocabulary,omitempty"`
}

// RecommendedResource describes a single recommended learning resource.
type RecommendedResource struct {
	Title      string `json:"title"`
	Reason     string `json:"reason"`
	Difficulty string `json:"difficulty"`
}

// VocabularyItem pairs a term with its translation and usage example.
type VocabularyItem struct {
	Term    string `json:"term"`
	Meaning string `json:"meaning"`
	Example string `json:"example"`
}

// SSEEvent is a single server-sent event payload.
type SSEEvent struct {
	Event string `json:"event,omitempty"`
	Data  string `json:"data"`
}

// IngestURLRequest triggers the ingestion of a single URL.
type IngestURLRequest struct {
	URL      string `json:"url" validate:"required,url"`
	Language string `json:"language" validate:"omitempty,max=10"`
}

// IngestBatchRequest triggers ingestion of multiple URLs.
type IngestBatchRequest struct {
	URLs []IngestURLRequest `json:"urls" validate:"required,min=1,max=50,dive"`
}

// HealthResponse is returned by the health check endpoint.
type HealthResponse struct {
	Status   string `json:"status"`
	Version  string `json:"version"`
	Postgres string `json:"postgres"`
	Redis    string `json:"redis"`
}
