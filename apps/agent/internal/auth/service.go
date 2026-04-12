package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims mirrors the JWT payload emitted by the NestJS backend.
type Claims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

// Service validates JWTs using the shared secret from the NestJS backend.
type Service struct {
	secret []byte
}

// NewService creates an auth service bound to the given HMAC secret.
func NewService(jwtSecret string) *Service {
	return &Service{secret: []byte(jwtSecret)}
}

var (
	ErrInvalidToken = errors.New("auth: invalid or expired token")
	ErrMissingClaim = errors.New("auth: missing required claim")
)

// ParseToken validates a raw JWT string and returns the extracted claims.
// The token must be signed with HS256 and the shared secret.
func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("auth: unexpected signing method %v", token.Header["alg"])
		}
		return s.secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	if claims.Sub == "" {
		return nil, ErrMissingClaim
	}

	return claims, nil
}

// UserID extracts the user UUID from validated claims.
func (c *Claims) UserID() (uuid.UUID, error) {
	return uuid.Parse(c.Sub)
}

// IsExpired checks whether the token has exceeded its lifetime.
func (c *Claims) IsExpired() bool {
	if c.ExpiresAt == nil {
		return true
	}
	return c.ExpiresAt.Time.Before(time.Now())
}
