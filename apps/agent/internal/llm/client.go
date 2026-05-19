package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client communicates with an Ollama server.
// Non-streaming calls use the native /api/chat endpoint (which correctly
// supports the "think" parameter for Qwen3 models).
// Streaming calls use the OpenAI-compatible /v1/chat/completions endpoint
// for SSE format compatibility.
type Client struct {
	baseURL    string
	model      string
	httpClient *http.Client
}

// NewClient creates a new LLM client.
func NewClient(baseURL, model string, timeout time.Duration) *Client {
	return &Client{
		baseURL: baseURL,
		model:   model,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Generate performs a non-streaming chat completion via Ollama's native API.
// Uses /api/chat with think=false to disable Qwen3's thinking mode and get
// direct content responses.
func (c *Client) Generate(ctx context.Context, messages []ChatMessage) (*ChatCompletionResponse, error) {
	req := OllamaChatRequest{
		Model:    c.model,
		Messages: messages,
		Stream:   false,
		Think:    boolPtr(false),
		Options: &OllamaOpts{
			Temperature: 0.7,
			NumPredict:  4096,
		},
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("llm: marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("llm: create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("llm: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("llm: unexpected status %d: %s", resp.StatusCode, string(respBody))
	}

	var ollamaResp OllamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("llm: decode response: %w", err)
	}

	// Convert Ollama native response to our standard ChatCompletionResponse
	// so the rest of the codebase stays unchanged.
	result := &ChatCompletionResponse{
		ID: ollamaResp.Model,
		Choices: []Choice{
			{
				Index:        0,
				Message:      ollamaResp.Message,
				FinishReason: ollamaResp.DoneReason,
			},
		},
	}

	return result, nil
}

// StreamRaw opens a streaming connection and returns the raw HTTP response body.
// The caller is responsible for closing the body. Use stream.Relay() to forward
// the tokens to the client via SSE.
// Uses the OpenAI-compatible /v1/chat/completions for SSE format, with the
// reasoning fallback in the Relay function for Qwen3 thinking mode.
func (c *Client) StreamRaw(ctx context.Context, messages []ChatMessage) (io.ReadCloser, error) {
	req := ChatCompletionRequest{
		Model:       c.model,
		Messages:    messages,
		Stream:      true,
		Temperature: 0.7,
		MaxTokens:   4096,
		Think:       boolPtr(false),
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("llm: marshal stream request: %w", err)
	}

	// Use a dedicated client without global timeout for streaming.
	streamClient := &http.Client{
		Timeout: 0,
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("llm: create stream request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")

	resp, err := streamClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("llm: stream request failed: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("llm: stream unexpected status %d: %s", resp.StatusCode, string(respBody))
	}

	return resp.Body, nil
}

func boolPtr(b bool) *bool { return &b }
