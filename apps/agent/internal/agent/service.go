package agent

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/steviggio/speakio-agent/internal/contextbuilder"
	"github.com/steviggio/speakio-agent/internal/llm"
	"github.com/steviggio/speakio-agent/internal/retrieval"
	"github.com/steviggio/speakio-agent/internal/users"
	"github.com/steviggio/speakio-agent/pkg/models"
)

// Service is the main agent orchestrator. It ties together context building,
// retrieval, prompt construction, and LLM communication.
type Service struct {
	contextBuilder *contextbuilder.Service
	retrieval      *retrieval.Service
	promptBuilder  *PromptBuilder
	formatter      *ResponseFormatter
	llmClient      *llm.Client
	userSvc        *users.Service
	logger         *slog.Logger
}

// NewService creates an agent service.
func NewService(
	cb *contextbuilder.Service,
	ret *retrieval.Service,
	pb *PromptBuilder,
	rf *ResponseFormatter,
	llmClient *llm.Client,
	userSvc *users.Service,
	logger *slog.Logger,
) *Service {
	return &Service{
		contextBuilder: cb,
		retrieval:      ret,
		promptBuilder:  pb,
		formatter:      rf,
		llmClient:      llmClient,
		userSvc:        userSvc,
		logger:         logger,
	}
}

// Chat handles a conversational request. If streaming is requested, tokens are
// relayed directly to the ResponseWriter via SSE.
func (s *Service) Chat(ctx context.Context, userID uuid.UUID, req *models.AgentChatRequest, w http.ResponseWriter) (*models.AgentResponse, error) {
	// 1. Build user context.
	userCtx, err := s.contextBuilder.Build(ctx, userID, req)
	if err != nil {
		s.logger.Error("agent: context build failed", "error", err)
		// Continue with nil context rather than failing completely.
		userCtx = &models.UserContext{UserID: userID}
	}

	// 2. Retrieve relevant documents.
	chunks, err := s.retrieval.Search(ctx, userCtx, req.Message)
	if err != nil {
		s.logger.Error("agent: retrieval failed", "error", err)
		// Continue without context rather than failing.
		chunks = nil
	}

	// 3. Build prompt.
	messages := s.promptBuilder.BuildChat(userCtx, req.Message, chunks)

	// 4. Stream or generate.
	if req.Stream {
		llm.SetSSEHeaders(w)
		body, err := s.llmClient.StreamRaw(ctx, messages)
		if err != nil {
			return nil, fmt.Errorf("agent: stream failed: %w", err)
		}
		if err := llm.Relay(s.logger, body, w); err != nil {
			s.logger.Error("agent: stream relay error", "error", err)
		}
		s.logInteraction(ctx, userID, req, chunks, "[streamed]")
		return nil, nil
	}

	// Non-streaming.
	resp, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("agent: generate failed: %w", err)
	}

	content := ""
	if len(resp.Choices) > 0 {
		content = resp.Choices[0].Message.Content
	}

	s.logInteraction(ctx, userID, req, chunks, content)

	return &models.AgentResponse{Content: content}, nil
}

// Recommend generates structured resource recommendations.
func (s *Service) Recommend(ctx context.Context, userID uuid.UUID, req *models.AgentRecommendRequest) (*models.RecommendationResponse, error) {
	userCtx := &models.UserContext{
		UserID:         userID,
		TargetLanguage: req.TargetLanguage,
		CEFRLevel:      req.CEFRLevel,
		GoalSlug:       req.Topic,
		SessionIntent:  "resource_advice",
	}

	chunks, err := s.retrieval.Search(ctx, userCtx, req.Topic)
	if err != nil {
		s.logger.Error("agent: retrieval for recommendation failed", "error", err)
		chunks = nil
	}

	messages := s.promptBuilder.BuildRecommendation(userCtx, req, chunks)

	resp, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("agent: recommend generate failed: %w", err)
	}

	content := ""
	if len(resp.Choices) > 0 {
		content = resp.Choices[0].Message.Content
	}

	return s.formatter.ParseRecommendation(content), nil
}

// Explain generates a grammar or concept explanation.
func (s *Service) Explain(ctx context.Context, userID uuid.UUID, req *models.AgentExplainRequest) (*models.AgentResponse, error) {
	userCtx := &models.UserContext{
		UserID:         userID,
		TargetLanguage: req.TargetLanguage,
		CEFRLevel:      req.CEFRLevel,
		GoalSlug:       req.Topic,
		SessionIntent:  "explanation",
	}

	chunks, err := s.retrieval.Search(ctx, userCtx, req.Topic)
	if err != nil {
		s.logger.Error("agent: retrieval for explanation failed", "error", err)
		chunks = nil
	}

	messages := s.promptBuilder.BuildExplanation(userCtx, req, chunks)

	resp, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("agent: explain generate failed: %w", err)
	}

	content := ""
	if len(resp.Choices) > 0 {
		content = resp.Choices[0].Message.Content
	}

	return &models.AgentResponse{Content: content}, nil
}

func (s *Service) logInteraction(ctx context.Context, userID uuid.UUID, req *models.AgentChatRequest, chunks []models.RetrievalResult, summary string) {
	var docIDs []uuid.UUID
	for _, c := range chunks {
		docIDs = append(docIDs, c.DocumentID)
	}

	interaction := &models.UserInteraction{
		ID:              uuid.New(),
		UserID:          userID,
		PageContext:     req.PageContext,
		Query:           req.Message,
		ResponseSummary: truncate(summary, 500),
		RetrievedDocIDs: docIDs,
		CreatedAt:       time.Now(),
	}

	if err := s.userSvc.SaveInteraction(ctx, interaction); err != nil {
		s.logger.Error("agent: failed to log interaction", "error", err)
	}
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "…"
}
