import { logger } from './logger';

interface FireworksResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  created: number;
}

interface FireworksMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class FireworksService {
  private apiKey: string;
  private baseURL = 'https://api.fireworks.ai/inference/v1';
  private defaultModel = 'accounts/fireworks/models/llama-v3p1-405b-instruct';

  constructor() {
    this.apiKey = process.env.FIREWORKS_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('FIREWORKS_API_KEY not found in environment variables');
    }
  }

  async generateCompletion(
    messages: FireworksMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const {
        model = this.defaultModel,
        temperature = 0.7,
        maxTokens = 4000,
      } = options;

      logger.info('Fireworks API request', {
        model,
        messageCount: messages.length,
        temperature,
        maxTokens
      });

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Fireworks API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Fireworks API error: ${response.status} ${response.statusText}`);
      }

      const data: FireworksResponse = await response.json();
      
      logger.info('Fireworks API response', {
        model: data.model,
        tokensUsed: data.usage?.total_tokens || 0,
        finishReason: data.choices[0]?.finish_reason
      });

      return data.choices[0]?.message?.content || 'No response generated';

    } catch (error) {
      logger.error('Fireworks service error', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async generateInsightAnalysis(data: any, analysisType: string): Promise<string> {
    const systemPrompt = `You are an expert airline revenue management and competitive intelligence analyst. 
    Provide concise, actionable insights based on the provided data. Focus on:
    - Key trends and patterns
    - Competitive positioning
    - Revenue optimization opportunities
    - Risk factors and mitigation strategies
    
    Keep responses professional and data-driven.`;

    const userPrompt = `Analyze the following ${analysisType} data and provide strategic insights:
    
    ${JSON.stringify(data, null, 2)}
    
    Please provide 3-5 key insights with specific recommendations.`;

    const messages: FireworksMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.generateCompletion(messages, {
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct', // Using Llama 3.1 70B for analysis
      temperature: 0.3, // Lower temperature for more focused analysis
      maxTokens: 2000
    });
  }

  async generateAlertSummary(alerts: any[]): Promise<string> {
    const systemPrompt = `You are an airline operations expert. Summarize multiple alerts into a concise executive briefing.
    Focus on:
    - Critical issues requiring immediate attention
    - Emerging patterns across routes or competitors
    - Priority recommendations
    
    Keep the summary under 300 words and highly actionable.`;

    const userPrompt = `Summarize these ${alerts.length} intelligence alerts into an executive briefing:
    
    ${JSON.stringify(alerts.slice(0, 10), null, 2)} // Limit to first 10 for context
    
    Provide a strategic summary with priority actions.`;

    const messages: FireworksMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.generateCompletion(messages, {
      model: 'accounts/fireworks/models/llama-v3p1-8b-instruct', // Using Llama 3.1 8B for summaries
      temperature: 0.4,
      maxTokens: 800
    });
  }

  async generateCompetitiveAnalysis(competitiveData: any): Promise<string> {
    const systemPrompt = `You are a competitive intelligence expert for airlines. Analyze competitor data and provide strategic recommendations.
    Focus on:
    - Market positioning analysis
    - Pricing strategy insights
    - Capacity deployment patterns
    - Competitive threats and opportunities
    
    Provide actionable intelligence for revenue management decisions.`;

    const userPrompt = `Analyze this competitive intelligence data:
    
    ${JSON.stringify(competitiveData, null, 2)}
    
    Provide strategic competitive analysis with specific recommendations.`;

    const messages: FireworksMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.generateCompletion(messages, {
      model: 'accounts/fireworks/models/mixtral-8x7b-instruct', // Using Mixtral for competitive analysis
      temperature: 0.5,
      maxTokens: 1500
    });
  }

  async generateRouteOptimization(routeData: any): Promise<string> {
    const systemPrompt = `You are a route optimization expert for airlines. Analyze route performance data and provide yield optimization strategies.
    Focus on:
    - Yield management opportunities
    - Capacity optimization
    - Seasonal adjustments
    - Demand forecasting insights
    
    Provide specific, implementable recommendations.`;

    const userPrompt = `Analyze this route performance data and provide optimization strategies:
    
    ${JSON.stringify(routeData, null, 2)}
    
    Provide detailed route optimization recommendations.`;

    const messages: FireworksMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.generateCompletion(messages, {
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct', // Using Llama 3.1 70B for complex optimization
      temperature: 0.3,
      maxTokens: 2000
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessages: FireworksMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Fireworks AI connection successful" if you can read this message.' }
      ];

      const response = await this.generateCompletion(testMessages, {
        model: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        temperature: 0.1,
        maxTokens: 50
      });

      logger.info('Fireworks connection test', { success: true, response });
      return response.toLowerCase().includes('successful');
    } catch (error) {
      logger.error('Fireworks connection test failed', { error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
        name: 'Llama 3.1 405B Instruct',
        description: 'Highest capability model for complex reasoning and analysis'
      },
      {
        id: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        name: 'Llama 3.1 70B Instruct',
        description: 'High performance model for detailed analysis and optimization'
      },
      {
        id: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        description: 'Fast and efficient model for summaries and quick analysis'
      },
      {
        id: 'accounts/fireworks/models/mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B Instruct',
        description: 'Excellent for structured analysis and reasoning tasks'
      },
      {
        id: 'accounts/fireworks/models/yi-large',
        name: 'Yi Large',
        description: 'High-quality model for general purpose tasks'
      }
    ];
  }
}

export const fireworksService = new FireworksService();