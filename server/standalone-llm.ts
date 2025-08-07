// Standalone LLM service for direct API access
import express from 'express';
import cors from 'cors';
import { logger } from './services/logger';
import { completeWithFireworks } from './services/fireworksService';
import OpenAI from 'openai';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Writer AI Client
class WriterClient {
  private apiKey: string;
  private baseUrl = 'https://api.writer.com/v1';

  constructor() {
    this.apiKey = process.env.WRITER_API_KEY || '';
  }

  async generate(params: { model: string; prompt: string }): Promise<{ text: string; confidence: number }> {
    if (!this.apiKey) {
      throw new Error('Writer API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'palmyra-x-5-32b',
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Writer API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      confidence: 0.9
    };
  }
}

// Generate AI analysis endpoint
app.post('/generate-analysis', async (req, res) => {
  try {
    const { prompt, provider, useRAG, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    logger.info('Standalone LLM analysis request', {
      provider: provider || 'openai',
      type,
      useRAG,
      promptLength: prompt.length
    });

    let analysis = '';
    let confidence = 0.9;
    
    try {
      if (provider === 'fireworks') {
        logger.info('Using Fireworks GPT-OSS-20B for analysis');
        analysis = await completeWithFireworks(prompt, { 
          max_tokens: 1500,
          temperature: 0.7 
        });
      } else if (provider === 'writer') {
        logger.info('Using Writer Palmyra X5 for analysis');
        const writerClient = new WriterClient();
        const result = await writerClient.generate({ 
          model: 'palmyra-x-5-32b', 
          prompt 
        });
        analysis = result.text;
        confidence = result.confidence;
      } else {
        logger.info('Using OpenAI GPT-4o for analysis');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert airline revenue management analyst specializing in EasyJet operations. Provide detailed, actionable strategic analysis with specific recommendations, financial projections, and implementation timelines.'
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        });
        analysis = response.choices[0]?.message?.content || '';
      }

      if (!analysis) {
        throw new Error('No analysis generated');
      }

      logger.info('Analysis generation completed', {
        provider: provider || 'openai',
        analysisLength: analysis.length,
        confidence
      });

      res.json({
        success: true,
        analysis,
        confidence,
        recommendations: [],
        provider: provider || 'openai'
      });

    } catch (error: any) {
      logger.error('LLM generation error', { 
        error: error?.message, 
        provider: provider || 'openai' 
      });
      
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to generate analysis',
        provider: provider || 'openai'
      });
    }

  } catch (error: any) {
    logger.error('Standalone analysis request error', { error: error?.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process analysis request'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'standalone-llm',
    timestamp: new Date().toISOString()
  });
});

const PORT = 6000; // Different port to avoid conflicts
app.listen(PORT, '0.0.0.0', () => {
  logger.info('Standalone LLM service started', { port: PORT });
  console.log(`🤖 Standalone LLM Service running on port ${PORT}`);
});