import { logger } from './logger';

interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  data?: any;
  content?: string;
  error?: string;
}

interface StreamingOptions {
  provider: 'openai' | 'writer' | 'fireworks';
  useRAG: boolean;
  type: 'strategic' | 'competitive' | 'performance' | 'network';
}

class StreamingApiService {
  
  async streamAnalysis(
    query: string, 
    options: StreamingOptions,
    onChunk: (content: string) => void,
    onStart?: (metadata: any) => void,
    onEnd?: (finalData: any) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    
    // Use fetch for streaming since EventSource doesn't support POST
    return this.fetchStream(query, options, onChunk, onStart, onEnd, onError);
  }

  private async fetchStream(
    query: string, 
    options: StreamingOptions,
    onChunk: (content: string) => void,
    onStart?: (metadata: any) => void,
    onEnd?: (finalData: any) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    
    const response = await fetch('/api/llm/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        type: options.type,
        useRAG: options.useRAG,
        provider: options.provider
      })
    });

    if (!response.ok) {
      throw new Error(`Streaming failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body not readable');
    }

    let fullContent = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamChunk = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'start':
                  onStart?.(data.data);
                  break;
                case 'chunk':
                  if (data.content) {
                    fullContent += data.content;
                    onChunk(data.content);
                  }
                  break;
                case 'end':
                  onEnd?.(data.data);
                  return fullContent;
                case 'error':
                  onError?.(data.error || 'Unknown streaming error');
                  throw new Error(data.error || 'Streaming error');
              }
            } catch (e) {
              logger.warn('StreamingAPI', 'fetchStream', 'Failed to parse SSE data', { line, error: e });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  // Cache management
  async invalidateCache(pattern?: string): Promise<void> {
    const response = await fetch('/api/cache/invalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pattern })
    });

    if (!response.ok) {
      throw new Error(`Cache invalidation failed: ${response.status}`);
    }
  }

  async getCacheStats(): Promise<{ size: number; keys: string[] }> {
    const response = await fetch('/api/cache/stats');
    
    if (!response.ok) {
      throw new Error(`Failed to get cache stats: ${response.status}`);
    }

    return response.json();
  }
}

export const streamingApi = new StreamingApiService();