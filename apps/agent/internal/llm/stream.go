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

// flushWriter abstracts flush behaviour so we can support both the legacy
// http.Flusher interface and the newer http.ResponseController (Go 1.20+).
type flushWriter struct {
	w  http.ResponseWriter
	rc *http.ResponseController
}

func newFlushWriter(w http.ResponseWriter) (*flushWriter, error) {
	rc := http.NewResponseController(w)

	// Probe: try a flush to see if the underlying writer supports it.
	if err := rc.Flush(); err != nil {
		// Fallback to the legacy interface.
		if _, ok := w.(http.Flusher); !ok {
			return nil, fmt.Errorf("llm/stream: response writer does not support flushing")
		}
	}

	return &flushWriter{w: w, rc: rc}, nil
}

func (fw *flushWriter) Flush() {
	if err := fw.rc.Flush(); err != nil {
		// Fallback: try the legacy Flusher interface.
		if f, ok := fw.w.(http.Flusher); ok {
			f.Flush()
		}
	}
}

// Relay reads SSE chunks from the vLLM stream and forwards them to the
// client's ResponseWriter. It flushes after each chunk for real-time display.
// Handles Qwen 3.5 thinking mode where content may arrive in a reasoning field.
func Relay(logger *slog.Logger, llmBody io.ReadCloser, w http.ResponseWriter) error {
	defer llmBody.Close()

	fw, err := newFlushWriter(w)
	if err != nil {
		return err
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
			fw.Flush()
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

		delta := chunk.Choices[0].Delta

		// Prefer content; fall back to reasoning (Qwen 3.5 thinking mode).
		content := delta.Content
		if content == "" {
			content = delta.Reasoning
		}
		if content == "" {
			continue
		}

		ssePayload, _ := json.Marshal(map[string]string{"content": content})
		fmt.Fprintf(w, "data: %s\n\n", ssePayload)
		fw.Flush()
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
