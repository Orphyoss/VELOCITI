import { Response } from 'express';
import { logger } from './logger.js';

interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  data?: any;
  content?: string;
  error?: string;
}

class StreamingService {
  
  setupSSE(res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
  }

  sendChunk(res: Response, chunk: StreamChunk): void {
    const data = JSON.stringify(chunk);
    res.write(`data: ${data}\n\n`);
  }

  sendStart(res: Response, metadata?: any): void {
    this.sendChunk(res, { type: 'start', data: metadata });
  }

  sendContent(res: Response, content: string): void {
    this.sendChunk(res, { type: 'chunk', content });
  }

  sendEnd(res: Response, finalData?: any): void {
    this.sendChunk(res, { type: 'end', data: finalData });
    res.end();
  }

  sendError(res: Response, error: string): void {
    logger.error('Streaming', 'sendError', 'Sending error to client', new Error(error));
    this.sendChunk(res, { type: 'error', error });
    res.end();
  }

  // For streaming OpenAI responses
  async streamOpenAI(openaiStream: any, res: Response): Promise<string> {
    let fullContent = '';
    
    try {
      logger.debug('Streaming', 'streamOpenAI', 'Starting OpenAI stream');
      this.sendStart(res, { provider: 'openai', model: 'gpt-4o' });
      
      for await (const chunk of openaiStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          this.sendContent(res, content);
          console.log(`[Streaming] Sent chunk: ${content.substring(0, 50)}...`);
        }
      }
      
      console.log(`[Streaming] OpenAI stream complete. Total content length: ${fullContent.length}`);
      this.sendEnd(res, { 
        fullContent,
        tokenCount: this.estimateTokens(fullContent),
        completedAt: new Date().toISOString()
      });
      
      return fullContent;
    } catch (error) {
      console.error('[Streaming] OpenAI streaming error:', error);
      this.sendError(res, error instanceof Error ? error.message : 'Streaming failed');
      throw error;
    }
  }

  // For streaming Writer API responses (simulated chunking)
  async streamWriter(writerResponse: string, res: Response): Promise<void> {
    try {
      console.log(`[Streaming] Starting Writer stream with content length: ${writerResponse.length}`);
      this.sendStart(res, { provider: 'writer', model: 'palmyra-x-004' });
      
      // Simulate streaming by breaking response into logical chunks
      const sentences = writerResponse.split(/(?<=[.!?])\s+/);
      let accumulatedContent = '';
      
      console.log(`[Streaming] Splitting Writer response into ${sentences.length} sentences`);
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (sentence.trim()) {
          const chunkContent = (i > 0 ? ' ' : '') + sentence;
          accumulatedContent += chunkContent;
          this.sendContent(res, chunkContent);
          
          console.log(`[Streaming] Sent Writer chunk ${i + 1}/${sentences.length}: ${sentence.substring(0, 30)}...`);
          
          // Add slight delay to simulate real streaming
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
      }
      
      console.log(`[Streaming] Writer stream complete. Total content: ${accumulatedContent.length} characters`);
      this.sendEnd(res, { 
        fullContent: accumulatedContent,
        tokenCount: this.estimateTokens(accumulatedContent),
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Streaming] Writer streaming error:', error);
      this.sendError(res, error instanceof Error ? error.message : 'Streaming failed');
      throw error;
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}

export const streamingService = new StreamingService();