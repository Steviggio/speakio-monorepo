package llm

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
)

// Relay reads SSE chunks from the vLLM stream and forwards them to the
// client's ResponseWriter. It flushes after each chunk for real-time display.
func Relay(logger *slog.Logger, llmBody io.ReadCloser, w http.ResponseWriter) error {
	defer llmBody.Close()

	flusher, ok := w.(http.Flusher)
	if !ok {
		return fmt.Errorf("llm/stream: response writer does not support flushing")
	}

	scanner := bufio.NewScanner(llmBody)
	for scanner.Scan() {
		line := scanner.Text()

		if line == "" {
			continue
		}

		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")

		if data == "[DONE]" {
			fmt.Fprintf(w, "data: [DONE]\n\n")
			flusher.Flush()
			break
		}

		var chunk StreamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			logger.Warn("llm/stream: failed to parse chunk", "error", err, "raw", data)
			continue
		}

		if len(chunk.Choices) == 0 {
			continue
		}

		content := chunk.Choices[0].Delta.Content
		if content == "" {
			continue
		}

		ssePayload, _ := json.Marshal(map[string]string{"content": content})
		fmt.Fprintf(w, "data: %s\n\n", ssePayload)
		flusher.Flush()
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("llm/stream: scanner error: %w", err)
	}

	return nil
}

// SetSSEHeaders configures the response for Server-Sent Events streaming.
func SetSSEHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
}
