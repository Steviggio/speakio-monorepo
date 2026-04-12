package httpapi

import (
	"net/http"

	"github.com/steviggio/speakio-agent/internal/auth"
)

// AuthMiddleware is a re-export of the auth middleware for router composition.
func AuthMiddleware(authSvc *auth.Service) func(http.Handler) http.Handler {
	return auth.Middleware(authSvc)
}
