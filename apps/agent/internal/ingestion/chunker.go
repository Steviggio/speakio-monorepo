package ingestion

import (
	"strings"
	"unicode/utf8"
)

// Chunk represents a semantically meaningful text fragment.
type Chunk struct {
	Index       int
	HeadingPath string
	Text        string
	TokenEst    int
}

// Chunker splits Markdown content into semantically coherent chunks by headings,
// with a maximum token estimate per chunk.
type Chunker struct {
	maxTokens int
}

// NewChunker creates a chunker with the given max token limit per chunk.
func NewChunker(maxTokens int) *Chunker {
	if maxTokens <= 0 {
		maxTokens = 512
	}
	return &Chunker{maxTokens: maxTokens}
}

// Split divides the Markdown into chunks following heading boundaries.
func (ch *Chunker) Split(markdown string) []Chunk {
	lines := strings.Split(markdown, "\n")
	var chunks []Chunk

	var currentHeadings []string
	var currentLines []string
	chunkIdx := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Detect headings.
		if strings.HasPrefix(trimmed, "#") {
			// Flush current chunk if it has content.
			if len(currentLines) > 0 {
				text := strings.TrimSpace(strings.Join(currentLines, "\n"))
				if text != "" {
					subChunks := ch.splitByTokenLimit(text, strings.Join(currentHeadings, " > "), chunkIdx)
					chunks = append(chunks, subChunks...)
					chunkIdx += len(subChunks)
				}
				currentLines = nil
			}

			// Parse heading level and update heading path.
			level := 0
			for _, c := range trimmed {
				if c == '#' {
					level++
				} else {
					break
				}
			}
			headingText := strings.TrimSpace(strings.TrimLeft(trimmed, "# "))

			// Trim headings to current level.
			if level <= len(currentHeadings) {
				currentHeadings = currentHeadings[:level-1]
			}
			currentHeadings = append(currentHeadings, headingText)
			continue
		}

		currentLines = append(currentLines, line)
	}

	// Flush remaining.
	if len(currentLines) > 0 {
		text := strings.TrimSpace(strings.Join(currentLines, "\n"))
		if text != "" {
			subChunks := ch.splitByTokenLimit(text, strings.Join(currentHeadings, " > "), chunkIdx)
			chunks = append(chunks, subChunks...)
		}
	}

	return chunks
}

// splitByTokenLimit breaks a text block into sub-chunks if it exceeds maxTokens.
func (ch *Chunker) splitByTokenLimit(text, headingPath string, startIdx int) []Chunk {
	est := estimateTokens(text)
	if est <= ch.maxTokens {
		return []Chunk{{
			Index:       startIdx,
			HeadingPath: headingPath,
			Text:        text,
			TokenEst:    est,
		}}
	}

	// Split by paragraphs first.
	paragraphs := strings.Split(text, "\n\n")
	var chunks []Chunk
	var accum []string
	accumTokens := 0
	idx := startIdx

	for _, p := range paragraphs {
		pTokens := estimateTokens(p)
		if accumTokens+pTokens > ch.maxTokens && len(accum) > 0 {
			chunks = append(chunks, Chunk{
				Index:       idx,
				HeadingPath: headingPath,
				Text:        strings.Join(accum, "\n\n"),
				TokenEst:    accumTokens,
			})
			idx++
			accum = nil
			accumTokens = 0
		}
		accum = append(accum, p)
		accumTokens += pTokens
	}

	if len(accum) > 0 {
		chunks = append(chunks, Chunk{
			Index:       idx,
			HeadingPath: headingPath,
			Text:        strings.Join(accum, "\n\n"),
			TokenEst:    accumTokens,
		})
	}

	return chunks
}

// estimateTokens provides a rough token count (~4 characters per token for multilingual).
func estimateTokens(text string) int {
	charCount := utf8.RuneCountInString(text)
	return (charCount + 3) / 4
}
