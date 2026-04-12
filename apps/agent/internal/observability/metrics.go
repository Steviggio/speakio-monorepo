package observability

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Metrics holds all Prometheus instruments for the agent service.
type Metrics struct {
	RequestsTotal    *prometheus.CounterVec
	RequestDuration  *prometheus.HistogramVec
	RetrievalDuration prometheus.Histogram
	LLMDuration       prometheus.Histogram
	LLMTokensTotal   *prometheus.CounterVec
	IngestionDuration prometheus.Histogram
	CacheHitsTotal    prometheus.Counter
	CacheMissesTotal  prometheus.Counter
}

// NewMetrics registers and returns all Prometheus metrics.
func NewMetrics() *Metrics {
	return &Metrics{
		RequestsTotal: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "agent_requests_total",
			Help: "Total number of HTTP requests by endpoint and status.",
		}, []string{"endpoint", "status"}),

		RequestDuration: promauto.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "agent_request_duration_seconds",
			Help:    "Latency of HTTP requests by endpoint.",
			Buckets: prometheus.DefBuckets,
		}, []string{"endpoint"}),

		RetrievalDuration: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "agent_retrieval_duration_seconds",
			Help:    "Time spent in the retrieval pipeline.",
			Buckets: []float64{0.05, 0.1, 0.25, 0.5, 1, 2, 5},
		}),

		LLMDuration: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "agent_llm_duration_seconds",
			Help:    "Time spent waiting for the LLM (first token to last).",
			Buckets: []float64{0.5, 1, 2, 5, 10, 30, 60},
		}),

		LLMTokensTotal: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "agent_llm_tokens_total",
			Help: "Estimated token count by direction (input/output).",
		}, []string{"direction"}),

		IngestionDuration: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "agent_ingestion_duration_seconds",
			Help:    "Time to fully process a single URL through the ingestion pipeline.",
			Buckets: []float64{1, 2, 5, 10, 30, 60, 120},
		}),

		CacheHitsTotal: promauto.NewCounter(prometheus.CounterOpts{
			Name: "agent_cache_hits_total",
			Help: "Number of cache hits.",
		}),

		CacheMissesTotal: promauto.NewCounter(prometheus.CounterOpts{
			Name: "agent_cache_misses_total",
			Help: "Number of cache misses.",
		}),
	}
}
