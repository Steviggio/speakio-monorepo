package httpapi

import (
	"net/http"
	"sync"
	"time"
)

// RateLimitMiddleware implements a simple per-IP sliding window rate limiter.
func RateLimitMiddleware(maxRequests int, window time.Duration) func(http.Handler) http.Handler {
	type clientEntry struct {
		count    int
		resetAt  time.Time
	}

	var mu sync.Mutex
	clients := make(map[string]*clientEntry)

	// Periodic cleanup of expired entries.
	go func() {
		ticker := time.NewTicker(window)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			now := time.Now()
			for ip, entry := range clients {
				if now.After(entry.resetAt) {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			mu.Lock()
			entry, exists := clients[ip]
			now := time.Now()

			if !exists || now.After(entry.resetAt) {
				clients[ip] = &clientEntry{
					count:   1,
					resetAt: now.Add(window),
				}
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}

			entry.count++
			if entry.count > maxRequests {
				mu.Unlock()
				http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}
			mu.Unlock()

			next.ServeHTTP(w, r)
		})
	}
}
