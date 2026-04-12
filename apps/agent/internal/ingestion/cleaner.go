package ingestion

import (
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// Cleaner removes non-content HTML elements, producing clean text-ready HTML.
type Cleaner struct{}

// NewCleaner creates a cleaner.
func NewCleaner() *Cleaner {
	return &Cleaner{}
}

// CleanHTML strips scripts, styles, navigation, footers, ads, and other
// non-pedagogical content from raw HTML.
func (c *Cleaner) CleanHTML(rawHTML string) (string, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(rawHTML))
	if err != nil {
		return "", err
	}

	// Remove unwanted elements.
	selectorsToRemove := []string{
		"script", "style", "noscript", "iframe",
		"nav", "footer", "header",
		"aside", ".sidebar", ".advertisement", ".ad",
		".cookie-banner", ".popup", ".modal",
		".social-share", ".share-buttons",
		".comments", "#comments",
		"[role='navigation']", "[role='banner']", "[role='contentinfo']",
	}

	for _, sel := range selectorsToRemove {
		doc.Find(sel).Remove()
	}

	// Extract the main content area if available.
	main := doc.Find("main, article, [role='main'], .content, #content")
	if main.Length() > 0 {
		html, err := main.First().Html()
		if err == nil {
			return html, nil
		}
	}

	// Fall back to body content.
	body := doc.Find("body")
	if body.Length() > 0 {
		html, err := body.Html()
		if err == nil {
			return html, nil
		}
	}

	return rawHTML, nil
}
