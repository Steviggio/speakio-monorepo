package httpapi

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (rr *responseRecorder) WriteHeader(code int) {
	rr.statusCode = code
	rr.ResponseWriter.WriteHeader(code)
}

// LoggingMiddleware logs request metadata with structured fields.
func LoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			requestID := uuid.New().String()

			w.Header().Set("X-Request-ID", requestID)

			recorder := &responseRecorder{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			next.ServeHTTP(recorder, r)

			logger.Info("http request",
				"request_id", requestID,
				"method", r.Method,
				"path", r.URL.Path,
				"status", recorder.statusCode,
				"duration_ms", time.Since(start).Milliseconds(),
				"remote_addr", r.RemoteAddr,
				"user_agent", r.UserAgent(),
			)
		})
	}
}
