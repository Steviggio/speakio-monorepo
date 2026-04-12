package ingestion

import (
	"crypto/sha256"
	"fmt"
)

// Dedup provides content deduplication via SHA-256 checksums.
type Dedup struct{}

// NewDedup creates a deduplicator.
func NewDedup() *Dedup {
	return &Dedup{}
}

// Checksum computes a SHA-256 hash of the content for deduplication.
func (d *Dedup) Checksum(content string) string {
	h := sha256.Sum256([]byte(content))
	return fmt.Sprintf("%x", h)
}
