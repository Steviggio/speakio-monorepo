package config

import (
	"fmt"
	"time"

	"github.com/caarlos0/env/v11"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port    int    `env:"PORT" envDefault:"3010"`
	AppEnv  string `env:"APP_ENV" envDefault:"development"`
	Version string `env:"APP_VERSION" envDefault:"0.1.0"`

	// Postgres
	DatabaseURL string `env:"DATABASE_URL,required"`

	// Redis
	RedisURL string `env:"REDIS_URL" envDefault:"redis://localhost:6379"`

	// vLLM
	VLLMBaseURL string `env:"VLLM_BASE_URL" envDefault:"http://localhost:8000"`
	VLLMModel   string `env:"VLLM_MODEL" envDefault:"Qwen/Qwen3-8B"`

	// Embeddings
	EmbeddingURL   string `env:"EMBEDDING_URL" envDefault:"http://localhost:8001"`
	EmbeddingModel string `env:"EMBEDDING_MODEL" envDefault:"BAAI/bge-m3"`
	EmbeddingDim   int    `env:"EMBEDDING_DIM" envDefault:"1024"`

	// Auth — shared with NestJS
	JWTSecret string `env:"JWT_SECRET,required"`

	// Observability
	LogLevel string `env:"LOG_LEVEL" envDefault:"info"`

	// Rate limiting
	RateLimitRPM int `env:"RATE_LIMIT_RPM" envDefault:"60"`

	// Retrieval
	MaxRetrievalChunks int `env:"MAX_RETRIEVAL_CHUNKS" envDefault:"6"`

	// Timeouts
	LLMTimeout       time.Duration `env:"LLM_TIMEOUT" envDefault:"60s"`
	RetrievalTimeout time.Duration `env:"RETRIEVAL_TIMEOUT" envDefault:"5s"`
	EmbeddingTimeout time.Duration `env:"EMBEDDING_TIMEOUT" envDefault:"10s"`
	FetchTimeout     time.Duration `env:"FETCH_TIMEOUT" envDefault:"15s"`
}

// Load parses the environment and returns a validated Config.
func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("config: failed to parse environment: %w", err)
	}
	return cfg, nil
}
