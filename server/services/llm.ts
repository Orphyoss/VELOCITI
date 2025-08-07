import OpenAI from 'openai';
import { logger } from './logger';
import { config } from './configValidator.js';
import { completeWithFireworks } from './fireworksService';

// Writer AI SDK interface
interface WriterAPI {
  generate(params: {
    model: string;
    prompt: string;
    context?: any;
  }): Promise<{ text: string; confidence: number }>;
}

// Real Writer implementation using HTTP API
class WriterClient implements WriterAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.writer.com/v1';

  constructor() {
    this.apiKey = config.WRITER_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('Writer', 'constructor', 'API key not found in environment variables');
    }
  }

  async generate(params: { model: string; prompt: string; context?: any }): Promise<{ text: string; confidence: number }> {
    if (!this.apiKey) {
      throw new Error('Writer API key not configured. Please add WRITER_API_KEY to environment variables.');
    }

    try {
      logger.info('Writer', 'generate', 'Making API request', { baseUrl: this.baseUrl, model: 'palmyra-x-5-32b' });
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'palmyra-x-5-32b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert airline revenue management analyst specializing in EasyJet operations. Provide detailed, actionable strategic analysis with specific recommendations and confidence assessments.'
            },
            {
              role: 'user',
              content: params.prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Writer', 'generate', 'API request failed', new Error(`${response.status} ${response.statusText}`), { errorText });
        throw new Error(`Writer API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'No response generated';
      
      // Calculate confidence based on response length and structure
      const confidence = this.calculateConfidence(text);
      
      logger.info('Writer', 'generate', 'Successfully generated content', { textLength: text.length, confidence });
      
      return {
        text,
        confidence
      };
    } catch (error) {
      logger.error('Writer', 'generate', 'API request error occurred', error);
      // Fallback to OpenAI if Writer fails
      logger.info('Writer', 'generate', 'Falling back to OpenAI for analysis');
      throw error;
    }
  }

  private calculateConfidence(text: string): number {
    // Calculate confidence based on response quality indicators
    const hasRecommendations = text.toLowerCase().includes('recommend');
    const hasSpecifics = /\d+/.test(text); // Contains numbers/data
    const isDetailed = text.length > 500;
    const hasStructure = text.includes('\n') || text.includes('•') || text.includes('-');
    
    let confidence = 0.6; // Base confidence
    if (hasRecommendations) confidence += 0.1;
    if (hasSpecifics) confidence += 0.1;
    if (isDetailed) confidence += 0.1;
    if (hasStructure) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "sk-default-key" 
});

const writer = new WriterClient();

export class LLMService {
  private currentProvider: 'openai' | 'writer' | 'fireworks' = 'writer';

  setProvider(provider: 'openai' | 'writer' | 'fireworks') {
    this.currentProvider = provider;
  }

  getAvailableProviders(): Array<{ id: string; name: string; model: string }> {
    return [
      { id: 'writer', name: 'Writer AI', model: 'Palmyra X5' },
      { id: 'openai', name: 'OpenAI', model: 'GPT-4o' },
      { id: 'fireworks', name: 'GPT OSS-20B', model: 'gpt-oss-20b' }
    ];
  }

  async generateStrategicAnalysis(prompt: string, context?: any): Promise<{
    analysis: string;
    confidence: number;
    recommendations: string[];
  }> {
    const startTime = Date.now();
    logger.info('LLM', 'generateStrategicAnalysis', 'Starting strategic analysis', { 
      provider: this.currentProvider, 
      promptPreview: prompt.substring(0, 100) + '...' 
    });
    
    try {
      if (this.currentProvider === 'writer') {
        logger.debug('LLM', 'generateStrategicAnalysis', 'Using Writer Palmyra X5 model');
        const response = await writer.generate({
          model: 'palmyra-x5',
          prompt: `Provide strategic analysis for EasyJet revenue management: ${prompt}`,
          context
        });

        const duration = Date.now() - startTime;
        logger.info('LLM', 'generateStrategicAnalysis', 'Writer analysis completed', { 
          duration, 
          confidence: response.confidence 
        });

        return {
          analysis: response.text,
          confidence: response.confidence,
          recommendations: this.extractRecommendations(response.text)
        };
      } else if (this.currentProvider === 'fireworks') {
        logger.debug('LLM', 'generateStrategicAnalysis', 'Using Fireworks GPT-OSS-20B model');
        const fireworksPrompt = `As an expert airline revenue management analyst specializing in EasyJet operations, provide strategic analysis for: ${prompt}

Please provide:
1. Key insights and analysis
2. Specific recommendations
3. Risk factors to consider
4. Implementation priorities

Keep the response focused and actionable.`;

        const response = await completeWithFireworks(fireworksPrompt, {
          max_tokens: 1500,
          temperature: 0.7
        });

        const duration = Date.now() - startTime;
        logger.info('LLM', 'generateStrategicAnalysis', 'Fireworks analysis completed', { 
          duration,
          model: 'gpt-oss-20b'
        });

        const confidence = this.calculateConfidenceFromText(response);
        
        return {
          analysis: response,
          confidence: confidence,
          recommendations: this.extractRecommendations(response)
        };
      } else {
        logger.debug('LLM', 'generateStrategicAnalysis', 'Using OpenAI GPT-4o model');
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert aviation revenue management analyst for EasyJet. Provide strategic analysis and actionable recommendations. Respond in JSON format with analysis, confidence (0-1), and recommendations array."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        });

        const duration = Date.now() - startTime;
        const result = JSON.parse(response.choices[0].message.content || '{}');
        
        logger.info('LLM', 'generateStrategicAnalysis', 'OpenAI analysis completed', {
          duration,
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          confidence: result.confidence || 0.8,
          recommendationsCount: result.recommendations?.length || 0
        });

        return {
          analysis: result.analysis || '',
          confidence: result.confidence || 0.8,
          recommendations: result.recommendations || []
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('LLM', 'generateStrategicAnalysis', `Strategic analysis failed after ${duration}ms`, error);
      throw error;
    }
  }

  async processDataQuery(query: string): Promise<{
    sql?: string;
    explanation: string;
    results?: any[];
  }> {
    const startTime = Date.now();
    logger.info('LLM', 'processDataQuery', 'Starting data query processing', { queryLength: query.length });
    
    try {
      // This would integrate with Databricks Genie API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are Databricks Genie helping with EasyJet data queries. Convert natural language to SQL and explain the query. Respond in JSON format."
          },
          {
            role: "user", 
            content: query
          }
        ],
        response_format: { type: "json_object" }
      });

      const duration = Date.now() - startTime;
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      logger.info('LLM', 'processDataQuery', 'Data query completed', { 
        duration, 
        promptTokens: response.usage?.prompt_tokens, 
        completionTokens: response.usage?.completion_tokens,
        hasSql: !!result.sql,
        explanationLength: result.explanation?.length || 0
      });

      return {
        sql: result.sql,
        explanation: result.explanation || '',
        results: [] // Would be populated by actual Databricks query
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('LLM', 'processDataQuery', `Data query failed after ${duration}ms`, error);
      throw error;
    }
  }

  private calculateConfidenceFromText(text: string): number {
    // Calculate confidence based on response quality indicators
    const hasRecommendations = text.toLowerCase().includes('recommend');
    const hasSpecifics = /\d+/.test(text); // Contains numbers/data
    const isDetailed = text.length > 500;
    const hasStructure = text.includes('\n') || text.includes('•') || text.includes('-');
    
    let confidence = 0.6; // Base confidence
    if (hasRecommendations) confidence += 0.1;
    if (hasSpecifics) confidence += 0.1;
    if (isDetailed) confidence += 0.1;
    if (hasStructure) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private extractRecommendations(text: string): string[] {
    // Simple extraction - would be more sophisticated in real implementation
    const lines = text.split('\n');
    return lines
      .filter(line => line.includes('recommend') || line.includes('suggest'))
      .slice(0, 5);
  }
}

export const llmService = new LLMService();
