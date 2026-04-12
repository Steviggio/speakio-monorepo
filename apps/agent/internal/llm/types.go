package llm

// ChatMessage represents a single message in the conversation history.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatCompletionRequest is the payload sent to the vLLM OpenAI-compatible endpoint.
type ChatCompletionRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Stream      bool          `json:"stream"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	TopP        float64       `json:"top_p,omitempty"`
}

// ChatCompletionResponse is a non-streaming response from vLLM.
type ChatCompletionResponse struct {
	ID      string   `json:"id"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

// Choice contains a single completion result.
type Choice struct {
	Index        int         `json:"index"`
	Message      ChatMessage `json:"message"`
	Delta        ChatMessage `json:"delta"`
	FinishReason string      `json:"finish_reason"`
}

// Usage reports the token counts for billing/monitoring.
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// StreamChunk represents a single SSE chunk in the streaming response.
type StreamChunk struct {
	ID      string   `json:"id"`
	Choices []Choice `json:"choices"`
}
