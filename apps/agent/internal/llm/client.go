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

// Client communicates with a vLLM server exposing an OpenAI-compatible API.
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

// Generate performs a non-streaming chat completion and returns the full response.
func (c *Client) Generate(ctx context.Context, messages []ChatMessage) (*ChatCompletionResponse, error) {
	req := ChatCompletionRequest{
		Model:       c.model,
		Messages:    messages,
		Stream:      false,
		Temperature: 0.7,
		MaxTokens:   2048,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("llm: marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/chat/completions", bytes.NewReader(body))
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

	var result ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("llm: decode response: %w", err)
	}

	return &result, nil
}

// StreamRaw opens a streaming connection and returns the raw HTTP response body.
// The caller is responsible for closing the body. Use stream.Relay() to forward
// the tokens to the client via SSE.
func (c *Client) StreamRaw(ctx context.Context, messages []ChatMessage) (io.ReadCloser, error) {
	req := ChatCompletionRequest{
		Model:       c.model,
		Messages:    messages,
		Stream:      true,
		Temperature: 0.7,
		MaxTokens:   2048,
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
