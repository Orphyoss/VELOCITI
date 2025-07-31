import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "sk-default-key" 
});

interface WriterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface WriterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class WriterService {
  private apiKey: string;
  private baseUrl: string = 'https://api.writer.com/v1';

  constructor() {
    this.apiKey = process.env.WRITER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[WriterService] Writer API key not found, falling back to OpenAI');
    }
  }

  async generateStrategicAnalysis(prompt: string, context?: any): Promise<string> {
    if (!this.apiKey) {
      console.log('[WriterService] Using OpenAI fallback for strategic analysis');
      return this.fallbackToOpenAI(prompt, context);
    }

    try {
      // Enhanced system prompt with RAG awareness
      let systemPrompt = `You are an expert revenue management analyst for EasyJet. Provide strategic insights and analysis based on airline industry data. Focus on actionable recommendations for revenue optimization, competitive positioning, and network performance.`;
      
      // Prepare user prompt with RAG context if available
      let userPrompt = prompt;
      if (context?.ragContext) {
        systemPrompt += ` Use the provided document context to inform your analysis with specific data and insights from EasyJet's internal documents and industry reports.`;
        userPrompt = `${prompt}\n\n=== RELEVANT DOCUMENT CONTEXT ===\n${context.ragContext}\n\n=== END CONTEXT ===\n\nPlease provide strategic analysis incorporating insights from the above context where relevant.`;
      } else if (context) {
        userPrompt = `${prompt}\n\nContext: ${JSON.stringify(context, null, 2)}`;
      }

      const messages: WriterMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'palmyra-x-004',
          messages,
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Writer API error: ${response.status} ${response.statusText}`);
      }

      const data: WriterResponse = await response.json();
      return data.choices[0]?.message?.content || 'Analysis could not be generated.';

    } catch (error) {
      console.error('[WriterService] Error calling Writer API:', error);
      console.log('[WriterService] Falling back to OpenAI');
      return this.fallbackToOpenAI(prompt, context);
    }
  }

  async generateCompetitiveIntelligence(routeData: any, competitorData: any): Promise<string> {
    const prompt = `Analyze the competitive landscape for this route and provide strategic recommendations:

Route Performance:
- Route: ${routeData.route || 'Unknown'}
- Current Yield: ${routeData.yield || 'N/A'}
- Load Factor: ${routeData.loadFactor || 'N/A'}
- Revenue vs Forecast: ${routeData.revenueVsForecast || 'N/A'}

Competitor Analysis:
${JSON.stringify(competitorData, null, 2)}

Provide:
1. Competitive position assessment
2. Pricing strategy recommendations
3. Market share opportunities
4. Risk factors and mitigation strategies
5. Revenue optimization tactics`;

    return this.generateStrategicAnalysis(prompt, { routeData, competitorData });
  }

  async generateNetworkAnalysis(networkMetrics: any): Promise<string> {
    const prompt = `Analyze the network performance and provide optimization recommendations:

Network Metrics:
${JSON.stringify(networkMetrics, null, 2)}

Provide:
1. Overall network health assessment
2. Capacity allocation recommendations
3. Route prioritization insights
4. Seasonal adjustment strategies
5. Growth opportunity identification
6. Risk management recommendations`;

    return this.generateStrategicAnalysis(prompt, networkMetrics);
  }

  async generatePerformanceAttribution(performanceData: any): Promise<string> {
    const prompt = `Analyze the performance variance and identify root causes:

Performance Data:
${JSON.stringify(performanceData, null, 2)}

Provide:
1. Root cause analysis of performance variances
2. Attribution breakdown (market, operational, strategic factors)
3. Corrective action recommendations
4. Forecast accuracy assessment
5. Process improvement suggestions`;

    return this.generateStrategicAnalysis(prompt, performanceData);
  }

  private async fallbackToOpenAI(prompt: string, context?: any): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert revenue management analyst for EasyJet. Provide strategic insights and analysis based on airline industry data. Focus on actionable recommendations for revenue optimization, competitive positioning, and network performance."
          },
          {
            role: "user",
            content: context ? `${prompt}\n\nContext: ${JSON.stringify(context, null, 2)}` : prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'Analysis could not be generated.';
    } catch (error) {
      console.error('[WriterService] OpenAI fallback failed:', error);
      return 'Strategic analysis is temporarily unavailable. Please try again later.';
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error', provider: 'writer' | 'openai-fallback' | 'unavailable', message?: string }> {
    if (!this.apiKey) {
      return { status: 'ok', provider: 'openai-fallback', message: 'Using OpenAI fallback' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { status: 'ok', provider: 'writer' };
      } else {
        return { status: 'error', provider: 'unavailable', message: `Writer API error: ${response.status}` };
      }
    } catch (error) {
      return { status: 'error', provider: 'unavailable', message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

export const writerService = new WriterService();