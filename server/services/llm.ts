import OpenAI from 'openai';

// Writer AI SDK (mock interface since package may not exist)
interface WriterAPI {
  generate(params: {
    model: string;
    prompt: string;
    context?: any;
  }): Promise<{ text: string; confidence: number }>;
}

// Mock Writer implementation - replace with actual SDK when available
class MockWriter implements WriterAPI {
  async generate(params: { model: string; prompt: string; context?: any }) {
    // This would be replaced with actual Writer API call
    return {
      text: "Strategic analysis would be generated here using Writer Palmyra X5",
      confidence: 0.95
    };
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "sk-default-key" 
});

const writer = new MockWriter(); // Replace with actual Writer SDK

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
    if (this.currentProvider === 'writer') {
      const response = await writer.generate({
        model: 'palmyra-x5',
        prompt: `Provide strategic analysis for EasyJet revenue management: ${prompt}`,
        context
      });

      return {
        analysis: response.text,
        confidence: response.confidence,
        recommendations: this.extractRecommendations(response.text)
      };
    } else {
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

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        analysis: result.analysis || '',
        confidence: result.confidence || 0.8,
        recommendations: result.recommendations || []
      };
    }
  }

  async processDataQuery(query: string): Promise<{
    sql?: string;
    explanation: string;
    results?: any[];
  }> {
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

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      sql: result.sql,
      explanation: result.explanation || '',
      results: [] // Would be populated by actual Databricks query
    };
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
