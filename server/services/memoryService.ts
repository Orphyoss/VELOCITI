import { storage } from '../storage';
import { pineconeService } from './pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MemoryContext {
  userId: string;
  sessionId: string;
  conversationHistory: ConversationMessage[];
  userPreferences: UserPreferences;
  agentLearnings: AgentLearning[];
  documentContext: DocumentContext[];
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    agentId?: string;
    confidence?: number;
    sources?: string[];
  };
}

interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'technical';
  preferredAnalysisDepth: 'quick' | 'standard' | 'comprehensive';
  industries: string[];
  routes: string[];
  alertTypes: string[];
  lastActivity: Date;
}

interface AgentLearning {
  agentId: string;
  pattern: string;
  confidence: number;
  successRate: number;
  feedback: 'positive' | 'negative' | 'neutral';
  context: string;
  timestamp: Date;
}

interface DocumentContext {
  filename: string;
  relevanceScore: number;
  lastAccessed: Date;
  accessCount: number;
  topics: string[];
}

export class MemoryService {
  private contextCache = new Map<string, MemoryContext>();
  
  constructor() {
    console.log('[MemoryService] Initializing intelligent memory system');
  }

  async getMemoryContext(userId: string, sessionId: string): Promise<MemoryContext> {
    const cacheKey = `${userId}-${sessionId}`;
    
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    // Build context from storage
    const conversations = await storage.getConversations(userId);
    const feedback = await storage.getFeedbackByAgent('all');
    
    const context: MemoryContext = {
      userId,
      sessionId,
      conversationHistory: this.buildConversationHistory(conversations),
      userPreferences: await this.getUserPreferences(userId),
      agentLearnings: await this.getAgentLearnings(userId),
      documentContext: await this.getDocumentContext(userId)
    };

    this.contextCache.set(cacheKey, context);
    return context;
  }

  private buildConversationHistory(conversations: any[]): ConversationMessage[] {
    return conversations
      .flatMap(conv => conv.messages || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50); // Keep last 50 messages
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Analyze user behavior patterns to infer preferences
    const activities = await storage.getRecentActivities(100);
    const userActivities = activities.filter(a => a.userId === userId);
    
    const preferences: UserPreferences = {
      communicationStyle: this.inferCommunicationStyle(userActivities),
      preferredAnalysisDepth: this.inferAnalysisDepth(userActivities),
      industries: this.extractIndustryPreferences(userActivities),
      routes: this.extractRoutePreferences(userActivities),
      alertTypes: this.extractAlertPreferences(userActivities),
      lastActivity: userActivities[0]?.createdAt || new Date()
    };

    return preferences;
  }

  private async getAgentLearnings(userId: string): Promise<AgentLearning[]> {
    // Get feedback for all agents to understand learning patterns
    const allFeedback = await storage.getFeedbackByAgent('competitive');
    const performanceFeedback = await storage.getFeedbackByAgent('performance');
    const networkFeedback = await storage.getFeedbackByAgent('network');
    
    return [
      ...this.processFeedbackToLearnings('competitive', allFeedback),
      ...this.processFeedbackToLearnings('performance', performanceFeedback),
      ...this.processFeedbackToLearnings('network', networkFeedback)
    ].slice(0, 20); // Keep top 20 learnings
  }

  private async getDocumentContext(userId: string): Promise<DocumentContext[]> {
    // Get document access patterns from recent queries
    const activities = await storage.getRecentActivities(50);
    const documentAccess = new Map<string, { count: number, lastAccess: Date }>();

    // Track document usage patterns
    activities.forEach(activity => {
      if (activity.type === 'query' && activity.metadata?.sources) {
        activity.metadata.sources.forEach((source: string) => {
          const current = documentAccess.get(source) || { count: 0, lastAccess: new Date(0) };
          documentAccess.set(source, {
            count: current.count + 1,
            lastAccess: new Date(activity.createdAt)
          });
        });
      }
    });

    return Array.from(documentAccess.entries()).map(([filename, data]) => ({
      filename,
      relevanceScore: Math.min(data.count / 10, 1.0), // Normalize to 0-1
      lastAccessed: data.lastAccess,
      accessCount: data.count,
      topics: [] // Will be enhanced with topic extraction
    }));
  }

  async addConversationMessage(
    userId: string, 
    sessionId: string, 
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const context = await this.getMemoryContext(userId, sessionId);
    
    const newMessage: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message
    };

    context.conversationHistory.unshift(newMessage);
    
    // Keep only recent messages
    context.conversationHistory = context.conversationHistory.slice(0, 50);
    
    // Update cache
    this.contextCache.set(`${userId}-${sessionId}`, context);
    
    // Persist to storage
    await this.persistConversationMessage(userId, newMessage);
  }

  async enhanceQueryWithMemory(query: string, userId: string, sessionId: string): Promise<{
    enhancedQuery: string;
    relevantContext: string[];
    documentSources: string[];
  }> {
    const context = await this.getMemoryContext(userId, sessionId);
    
    // Get relevant document context from RAG
    const documentResults = await pineconeService.searchSimilar(query, 5);
    
    // Build enhanced query with context
    const conversationContext = this.buildConversationContext(context.conversationHistory);
    const preferenceContext = this.buildPreferenceContext(context.userPreferences);
    const learningContext = this.buildLearningContext(context.agentLearnings, query);
    
    const enhancedQuery = `
Context from conversation history:
${conversationContext}

User preferences:
${preferenceContext}

Relevant learnings:
${learningContext}

Current query: ${query}

Please provide a response that takes into account the user's history, preferences, and previous learnings.
    `.trim();

    return {
      enhancedQuery,
      relevantContext: [conversationContext, preferenceContext, learningContext].filter(Boolean),
      documentSources: documentResults.map(r => r.metadata.filename)
    };
  }

  async recordAgentFeedback(
    agentId: string,
    query: string,
    response: string,
    feedback: 'positive' | 'negative' | 'neutral',
    userId: string
  ): Promise<void> {
    const learning: AgentLearning = {
      agentId,
      pattern: await this.extractPattern(query, response),
      confidence: feedback === 'positive' ? 0.8 : feedback === 'negative' ? 0.2 : 0.5,
      successRate: await this.calculateSuccessRate(agentId),
      feedback,
      context: `Query: ${query.slice(0, 100)}... Response: ${response.slice(0, 100)}...`,
      timestamp: new Date()
    };

    // Store feedback
    await storage.createFeedback({
      agentId,
      query,
      response,
      feedback,
      userId,
      metadata: { pattern: learning.pattern }
    });

    console.log(`[MemoryService] Recorded ${feedback} feedback for ${agentId}`);
  }

  private inferCommunicationStyle(activities: any[]): 'concise' | 'detailed' | 'technical' {
    // Simple heuristic based on query length and technical terms
    const avgQueryLength = activities
      .filter(a => a.type === 'query')
      .reduce((sum, a) => sum + (a.title?.length || 0), 0) / activities.length;
    
    if (avgQueryLength > 100) return 'detailed';
    if (avgQueryLength < 30) return 'concise';
    return 'technical';
  }

  private inferAnalysisDepth(activities: any[]): 'quick' | 'standard' | 'comprehensive' {
    // Based on activity patterns
    const frequentUser = activities.length > 20;
    const detailedQueries = activities.filter(a => a.type === 'query' && (a.title?.length || 0) > 50);
    
    if (frequentUser && detailedQueries.length > 5) return 'comprehensive';
    if (detailedQueries.length > 2) return 'standard';
    return 'quick';
  }

  private extractIndustryPreferences(activities: any[]): string[] {
    // Extract industries from query patterns
    const industries = new Set<string>();
    activities.forEach(activity => {
      if (activity.title?.toLowerCase().includes('airline')) industries.add('Aviation');
      if (activity.title?.toLowerCase().includes('route')) industries.add('Route Planning');
      if (activity.title?.toLowerCase().includes('pricing')) industries.add('Revenue Management');
    });
    return Array.from(industries);
  }

  private extractRoutePreferences(activities: any[]): string[] {
    // Extract route patterns from activities
    const routePattern = /[A-Z]{3}[→-][A-Z]{3}/g;
    const routes = new Set<string>();
    
    activities.forEach(activity => {
      const matches = activity.title?.match(routePattern) || [];
      matches.forEach(route => routes.add(route));
    });
    
    return Array.from(routes);
  }

  private extractAlertPreferences(activities: any[]): string[] {
    const alertTypes = new Set<string>();
    activities.forEach(activity => {
      if (activity.type === 'alert') {
        alertTypes.add(activity.title?.split(' ')[0] || 'general');
      }
    });
    return Array.from(alertTypes);
  }

  private processFeedbackToLearnings(agentId: string, feedback: any[]): AgentLearning[] {
    return feedback.map(f => ({
      agentId,
      pattern: f.metadata?.pattern || 'general',
      confidence: f.feedback === 'positive' ? 0.8 : 0.3,
      successRate: 0.7, // Will be calculated properly
      feedback: f.feedback,
      context: f.query?.slice(0, 100) || 'context',
      timestamp: new Date(f.createdAt)
    }));
  }

  private buildConversationContext(history: ConversationMessage[]): string {
    return history
      .slice(0, 5) // Last 5 messages
      .map(msg => `${msg.role}: ${msg.content.slice(0, 200)}`)
      .join('\n');
  }

  private buildPreferenceContext(preferences: UserPreferences): string {
    return `Communication: ${preferences.communicationStyle}, Analysis: ${preferences.preferredAnalysisDepth}, Focus: ${preferences.industries.join(', ')}`;
  }

  private buildLearningContext(learnings: AgentLearning[], query: string): string {
    // Find learnings relevant to current query
    const relevantLearnings = learnings
      .filter(l => this.isRelevantLearning(l, query))
      .slice(0, 3);
    
    return relevantLearnings
      .map(l => `${l.agentId}: ${l.pattern} (confidence: ${l.confidence})`)
      .join('\n');
  }

  private isRelevantLearning(learning: AgentLearning, query: string): boolean {
    // Simple relevance check
    const queryLower = query.toLowerCase();
    const patternLower = learning.pattern.toLowerCase();
    
    return queryLower.includes(patternLower) || patternLower.includes(queryLower);
  }

  private async extractPattern(query: string, response: string): Promise<string> {
    try {
      // Use OpenAI to extract patterns
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Extract a short pattern or theme from this query-response pair. Return only a brief phrase describing the main topic or pattern."
          },
          {
            role: "user",
            content: `Query: ${query}\nResponse: ${response.slice(0, 500)}`
          }
        ],
        max_tokens: 50
      });

      return completion.choices[0].message.content?.trim() || 'general query';
    } catch (error) {
      console.error('[MemoryService] Pattern extraction error:', error);
      return 'general query';
    }
  }

  private async calculateSuccessRate(agentId: string): Promise<number> {
    const feedback = await storage.getFeedbackByAgent(agentId);
    if (feedback.length === 0) return 0.5;
    
    const positive = feedback.filter(f => f.feedback === 'positive').length;
    return positive / feedback.length;
  }

  private async persistConversationMessage(userId: string, message: ConversationMessage): Promise<void> {
    try {
      await storage.createActivity({
        type: 'conversation',
        title: `Message: ${message.content.slice(0, 50)}...`,
        description: message.content,
        userId,
        metadata: {
          messageId: message.id,
          role: message.role,
          agentId: message.metadata?.agentId
        }
      });
    } catch (error) {
      console.error('[MemoryService] Failed to persist message:', error);
    }
  }

  async clearUserContext(userId: string, sessionId: string): Promise<void> {
    const cacheKey = `${userId}-${sessionId}`;
    this.contextCache.delete(cacheKey);
    console.log(`[MemoryService] Cleared context for user ${userId}, session ${sessionId}`);
  }

  async getMemoryStats(): Promise<{
    activeContexts: number;
    totalConversations: number;
    totalLearnings: number;
    memoryUsage: string;
  }> {
    const conversations = await storage.getConversations('all');
    const allFeedback = await storage.getFeedbackByAgent('all');
    
    return {
      activeContexts: this.contextCache.size,
      totalConversations: conversations.length,
      totalLearnings: allFeedback.length,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }
}

export const memoryService = new MemoryService();