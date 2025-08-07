import { Router } from 'express';
import { llmService } from '../services/llm';
import { logger } from '../services/logger';
import { pineconeService } from '../services/pinecone';
import { completeWithFireworks } from '../services/fireworksService';
import OpenAI from 'openai';

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

    const requestBody = {
      model: 'palmyra-x-5-32b',
      messages: [{ role: 'user', content: params.prompt }],
      max_tokens: 1000,
      temperature: 0.7
    };

    logger.info('Writer API request (LLM)', { 
      url: `${this.baseUrl}/chat/completions`,
      model: requestBody.model,
      promptLength: params.prompt.length,
      hasApiKey: !!this.apiKey
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Writer API error details (LLM)', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });
      throw new Error(`Writer API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      confidence: 0.9
    };
  }
}

const router = Router();

// LLM streaming endpoint
router.post('/stream', async (req, res) => {
  try {
    const { query, type, provider, useRAG } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Set headers for JSON response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    logger.info('LLM stream request', {
      provider,
      type,
      useRAG,
      queryLength: query.length
    });

    // Get RAG context if requested
    let ragContext = '';
    if (useRAG) {
      try {
        const ragResults = await pineconeService.search(query, 3);
        if (ragResults.length > 0) {
          ragContext = ragResults.map((result: any) => 
            `Source: ${result.metadata?.filename || 'Unknown'}\n${result.text || result.pageContent || ''}`
          ).join('\n\n---\n\n');
        }
      } catch (error: any) {
        logger.warn('RAG context retrieval failed', { error: error?.message });
      }
    }

    // Create enhanced prompt with context
    const enhancedPrompt = ragContext 
      ? `Context from documents:\n${ragContext}\n\nQuery: ${query}`
      : query;

    // Stream response
    try {
      // Use the appropriate LLM service method
      let completion = '';
      if (provider === 'fireworks') {
        completion = await completeWithFireworks(enhancedPrompt, { max_tokens: 1000 });
      } else if (provider === 'writer') {
        const writerClient = new WriterClient();
        const result = await writerClient.generate({ 
          model: 'palmyra-x-5-32b', 
          prompt: enhancedPrompt 
        });
        completion = result.text;
      } else {
        // OpenAI default
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: enhancedPrompt }],
          max_tokens: 1000
        });
        completion = response.choices[0]?.message?.content || '';
      }

      // Return complete response as JSON
      res.json({
        success: true,
        content: completion,
        provider: provider || 'openai',
        hasRAG: !!ragContext
      });

    } catch (error: any) {
      logger.error('LLM streaming error', { error: error?.message, provider });
      return res.status(500).json({
        success: false,
        error: error?.message || 'Unknown error',
        provider: provider || 'openai'
      });
    }

  } catch (error) {
    logger.error('LLM stream setup error', { error: error.message });
    res.status(500).json({ error: 'Failed to initialize streaming' });
  }
});

// Provider selection endpoint
router.post('/provider', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!['openai', 'writer', 'fireworks'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Store provider preference in session or return success
    res.json({ success: true, provider });
  } catch (error) {
    logger.error('Provider selection error', { error: error.message });
    res.status(500).json({ error: 'Failed to set provider' });
  }
});

export default router;