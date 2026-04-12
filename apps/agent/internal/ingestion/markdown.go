package ingestion

import (
	"strings"

	htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"
)

// MarkdownConverter transforms cleaned HTML into Markdown.
type MarkdownConverter struct{}

// NewMarkdownConverter creates a Markdown converter.
func NewMarkdownConverter() *MarkdownConverter {
	return &MarkdownConverter{}
}

// ToMarkdown converts cleaned HTML to Markdown, preserving heading hierarchy.
func (mc *MarkdownConverter) ToMarkdown(cleanHTML string) (string, error) {
	md, err := htmltomarkdown.ConvertString(cleanHTML)
	if err != nil {
		return "", err
	}

	// Normalise excessive whitespace.
	lines := strings.Split(md, "\n")
	var result []string
	blankCount := 0
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			blankCount++
			if blankCount <= 2 {
				result = append(result, "")
			}
			continue
		}
		blankCount = 0
		result = append(result, line)
	}

	return strings.TrimSpace(strings.Join(result, "\n")), nil
}
