import OpenAI from 'openai';
import { cacheService } from './cacheService.js';
import { streamingService } from './streamingService.js';
import { Response } from 'express';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "sk-default-key" 
});

interface EnhancedLLMResponse {
  analysis: string;
  confidence: number;
  recommendations: string[];
  metadata?: {
    model: string;
    tokenCount: number;
    responseTime: number;
    cached: boolean;
  };
}

class EnhancedLLMService {
  
  async queryLLM(
    prompt: string, 
    queryType: 'strategic' | 'competitive' | 'performance' | 'network' = 'strategic',
    ragContext?: string,
    res?: Response
  ): Promise<EnhancedLLMResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = cacheService.generateKey(prompt, 'openai', { queryType, ragContext });
    const cached = cacheService.get(cacheKey);
    
    if (cached && !res) {
      console.log('[EnhancedLLM] Returning cached OpenAI response');
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          responseTime: Date.now() - startTime
        }
      };
    }

    try {
      // Enhanced system prompt based on query type
      const systemPrompt = this.getSystemPrompt(queryType);
      
      // Prepare messages with RAG context
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
      ];

      if (ragContext) {
        messages.push({
          role: 'user',
          content: `${prompt}\n\n=== RELEVANT CONTEXT ===\n${ragContext}\n\n=== END CONTEXT ===\n\nPlease provide analysis incorporating insights from the above context.`
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      // Use streaming if SSE response provided
      if (res) {
        return await this.streamResponse(messages, res, cacheKey, startTime);
      } else {
        return await this.standardResponse(messages, cacheKey, startTime);
      }

    } catch (error) {
      console.error('[EnhancedLLM] Error:', error);
      throw new Error(`LLM query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async streamResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    res: Response,
    cacheKey: string,
    startTime: number
  ): Promise<EnhancedLLMResponse> {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      stream: true,
      max_tokens: 2000,
      temperature: 0.7
    });

    const fullContent = await streamingService.streamOpenAI(stream, res);
    const response = this.parseResponse(fullContent);
    const duration = Date.now() - startTime;

    const enhancedResponse: EnhancedLLMResponse = {
      ...response,
      metadata: {
        model: 'gpt-4o',
        tokenCount: streamingService.estimateTokens(fullContent),
        responseTime: duration,
        cached: false
      }
    };

    // Cache the result
    cacheService.setStrategicAnalysis(cacheKey, enhancedResponse);

    return enhancedResponse;
  }

  private async standardResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    cacheKey: string,
    startTime: number
  ): Promise<EnhancedLLMResponse> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '';
    const response = this.parseResponse(content);
    const duration = Date.now() - startTime;

    const enhancedResponse: EnhancedLLMResponse = {
      ...response,
      metadata: {
        model: 'gpt-4o',
        tokenCount: completion.usage?.total_tokens || 0,
        responseTime: duration,
        cached: false
      }
    };

    // Cache the result
    cacheService.setStrategicAnalysis(cacheKey, enhancedResponse);

    console.log(`[EnhancedLLM] OpenAI analysis completed in ${duration}ms, ${completion.usage?.total_tokens} tokens`);

    return enhancedResponse;
  }

  private getSystemPrompt(queryType: string): string {
    const basePrompt = `You are an expert revenue management analyst for EasyJet. Provide strategic insights and analysis based on airline industry data. Always respond in JSON format with the following structure:
{
  "analysis": "detailed analysis text",
  "confidence": 0.85,
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

    const typeSpecific = {
      strategic: 'Focus on high-level strategic decisions, market positioning, and long-term revenue optimization.',
      competitive: 'Focus on competitor analysis, market share dynamics, and competitive response strategies.',
      performance: 'Focus on operational performance metrics, efficiency improvements, and KPI optimization.',
      network: 'Focus on route network optimization, capacity allocation, and network-wide performance.'
    };

    return `${basePrompt}\n\n${typeSpecific[queryType as keyof typeof typeSpecific] || typeSpecific.strategic}`;
  }

  private parseResponse(content: string): { analysis: string; confidence: number; recommendations: string[] } {
    try {
      const parsed = JSON.parse(content);
      return {
        analysis: parsed.analysis || content,
        confidence: parsed.confidence || 0.85,
        recommendations: parsed.recommendations || []
      };
    } catch {
      // Fallback for non-JSON responses
      return {
        analysis: content,
        confidence: 0.85,
        recommendations: this.extractRecommendations(content)
      };
    }
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^\*|^•/)) {
        recommendations.push(line.replace(/^\d+\.|^[-*•]\s*/, '').trim());
      }
    }
    
    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  // Cache management methods
  invalidateCache(pattern?: string): void {
    if (pattern) {
      cacheService.invalidatePattern(pattern);
    } else {
      cacheService.clear();
    }
  }

  getCacheStats(): any {
    return cacheService.getStats();
  }
}

export const enhancedLLMService = new EnhancedLLMService();