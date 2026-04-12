package ingestion

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Fetcher retrieves HTML content from URLs with safety checks.
type Fetcher struct {
	httpClient *http.Client
	maxSize    int64
}

// NewFetcher creates a fetcher with timeout and size limits.
func NewFetcher(timeout time.Duration) *Fetcher {
	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: 10 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
	}

	return &Fetcher{
		httpClient: &http.Client{
			Timeout:   timeout,
			Transport: transport,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 5 {
					return fmt.Errorf("fetcher: too many redirects")
				}
				return nil
			},
		},
		maxSize: 10 * 1024 * 1024, // 10MB
	}
}

// FetchResult contains the fetched HTML and metadata.
type FetchResult struct {
	HTML        string
	URL         string
	Domain      string
	ContentType string
	StatusCode  int
}

// Fetch retrieves a URL with SSRF protection and size limits.
func (f *Fetcher) Fetch(ctx context.Context, rawURL string) (*FetchResult, error) {
	if err := f.validateURL(rawURL); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("fetcher: create request: %w", err)
	}
	req.Header.Set("User-Agent", "SpeakioBot/1.0 (+https://speakio.com/bot)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetcher: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetcher: unexpected status %d for %s", resp.StatusCode, rawURL)
	}

	limited := io.LimitReader(resp.Body, f.maxSize)
	body, err := io.ReadAll(limited)
	if err != nil {
		return nil, fmt.Errorf("fetcher: read body: %w", err)
	}

	parsed, _ := url.Parse(rawURL)

	return &FetchResult{
		HTML:        string(body),
		URL:         rawURL,
		Domain:      parsed.Hostname(),
		ContentType: resp.Header.Get("Content-Type"),
		StatusCode:  resp.StatusCode,
	}, nil
}

// validateURL ensures the URL is safe (no internal IPs, valid scheme).
func (f *Fetcher) validateURL(rawURL string) error {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("fetcher: invalid URL: %w", err)
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("fetcher: unsupported scheme %q", parsed.Scheme)
	}

	host := parsed.Hostname()
	if host == "" {
		return fmt.Errorf("fetcher: empty hostname")
	}

	// Block internal / private IP ranges (SSRF protection).
	blockedPrefixes := []string{
		"127.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
		"172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
		"172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
		"0.", "169.254.", "::1", "fc00:", "fe80:",
	}
	for _, prefix := range blockedPrefixes {
		if strings.HasPrefix(host, prefix) {
			return fmt.Errorf("fetcher: blocked private IP range")
		}
	}

	if host == "localhost" || host == "metadata.google.internal" {
		return fmt.Errorf("fetcher: blocked hostname %q", host)
	}

	return nil
}
