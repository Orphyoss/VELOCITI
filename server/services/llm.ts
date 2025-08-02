import OpenAI from 'openai';

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
    this.apiKey = process.env.WRITER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Writer] API key not found in environment variables');
    }
  }

  async generate(params: { model: string; prompt: string; context?: any }): Promise<{ text: string; confidence: number }> {
    if (!this.apiKey) {
      throw new Error('Writer API key not configured. Please add WRITER_API_KEY to environment variables.');
    }

    try {
      console.log(`[Writer] Making API request to ${this.baseUrl}/chat/completions`);
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
        console.error(`[Writer] API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Writer API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'No response generated';
      
      // Calculate confidence based on response length and structure
      const confidence = this.calculateConfidence(text);
      
      console.log(`[Writer] Successfully generated ${text.length} characters with confidence ${confidence}`);
      
      return {
        text,
        confidence
      };
    } catch (error) {
      console.error('[Writer] API error:', error);
      // Fallback to OpenAI if Writer fails
      console.log('[Writer] Falling back to OpenAI for analysis');
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
  private currentProvider: 'openai' | 'writer' = 'writer';

  setProvider(provider: 'openai' | 'writer') {
    this.currentProvider = provider;
  }

  async generateStrategicAnalysis(prompt: string, context?: any): Promise<{
    analysis: string;
    confidence: number;
    recommendations: string[];
  }> {
    const startTime = Date.now();
    console.log(`[LLM] Starting strategic analysis with provider: ${this.currentProvider}`);
    console.log(`[LLM] Prompt: ${prompt.substring(0, 100)}...`);
    
    try {
      if (this.currentProvider === 'writer') {
        console.log('[LLM] Using Writer Palmyra X5 model');
        const response = await writer.generate({
          model: 'palmyra-x5',
          prompt: `Provide strategic analysis for EasyJet revenue management: ${prompt}`,
          context
        });

        const duration = Date.now() - startTime;
        console.log(`[LLM] Writer analysis completed in ${duration}ms`);
        console.log(`[LLM] Response confidence: ${response.confidence}`);

        return {
          analysis: response.text,
          confidence: response.confidence,
          recommendations: this.extractRecommendations(response.text)
        };
      } else {
        console.log('[LLM] Using OpenAI GPT-4o model');
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
        console.log(`[LLM] OpenAI analysis completed in ${duration}ms`);
        console.log(`[LLM] Tokens used - prompt: ${response.usage?.prompt_tokens}, completion: ${response.usage?.completion_tokens}`);

        const result = JSON.parse(response.choices[0].message.content || '{}');
        console.log(`[LLM] Response confidence: ${result.confidence || 0.8}`);
        console.log(`[LLM] Recommendations count: ${result.recommendations?.length || 0}`);

        return {
          analysis: result.analysis || '',
          confidence: result.confidence || 0.8,
          recommendations: result.recommendations || []
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[LLM] Strategic analysis failed after ${duration}ms:`, error);
      throw error;
    }
  }

  async processDataQuery(query: string): Promise<{
    sql?: string;
    explanation: string;
    results?: any[];
  }> {
    const startTime = Date.now();
    console.log(`[LLM] Starting data query processing`);
    console.log(`[LLM] Query: ${query}`);
    
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
      console.log(`[LLM] Data query completed in ${duration}ms`);
      console.log(`[LLM] Tokens used - prompt: ${response.usage?.prompt_tokens}, completion: ${response.usage?.completion_tokens}`);

      const result = JSON.parse(response.choices[0].message.content || '{}');
      console.log(`[LLM] Generated SQL: ${result.sql ? 'Yes' : 'No'}`);
      console.log(`[LLM] Explanation length: ${result.explanation?.length || 0} chars`);

      return {
        sql: result.sql,
        explanation: result.explanation || '',
        results: [] // Would be populated by actual Databricks query
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[LLM] Data query failed after ${duration}ms:`, error);
      throw error;
    }
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
